-- Migration: Fix RPC Filtering for Omni-TCG
-- Description: Updates get_products_filtered to use standard game codes and avoid hardcoded translations.

CREATE OR REPLACE FUNCTION public.get_products_filtered(
    search_query text DEFAULT NULL::text,
    game_filter text DEFAULT NULL::text,
    set_filter text[] DEFAULT NULL::text[],
    rarity_filter text[] DEFAULT NULL::text[],
    type_filter text[] DEFAULT NULL::text[],
    color_filter text[] DEFAULT NULL::text[],
    year_from integer DEFAULT NULL::integer,
    year_to integer DEFAULT NULL::integer,
    sort_by text DEFAULT 'newest'::text,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    price_min numeric DEFAULT NULL::numeric,
    price_max numeric DEFAULT NULL::numeric,
    p_only_new boolean DEFAULT false
)
RETURNS TABLE (
    id uuid,
    name text,
    game text,
    set_code text,
    price numeric,
    image_url text,
    rarity text,
    printing_id uuid,
    stock integer,
    set_name text,
    finish text,
    updated_at timestamptz
) AS $$
DECLARE
    v_game_code TEXT;
    v_sort_by TEXT;
    v_has_recent BOOLEAN;
BEGIN
    v_sort_by := LOWER(TRIM(COALESCE(sort_by, 'newest')));
    
    -- Standardize game code input
    IF game_filter IS NULL OR game_filter = '' THEN
        v_game_code := NULL;
    ELSIF game_filter IN ('MTG', 'Magic', 'Magic: The Gathering') THEN
        v_game_code := 'MTG';
    ELSE
        v_game_code := game_filter; -- Use the code directly (PKM, OPC, DGM, etc.)
    END IF;

    -- Check for "New Items" window
    IF p_only_new THEN
        SELECT EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.stock > 0
              AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
              AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
              AND p.updated_at >= NOW() - INTERVAL '12 days'
        ) INTO v_has_recent;
    ELSE
        v_has_recent := FALSE;
    END IF;

    RETURN QUERY
    SELECT 
        p.id, p.name::text, p.game::text, p.set_code::text, p.price_usd as price,
        p.image_url::text, p.rarity::text, p.printing_id, p.stock, p.set_name::text,
        LOWER(COALESCE(p.finish, 'nonfoil')) as finish,
        p.updated_at
    FROM public.products p
    WHERE 
        p.stock > 0
        AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
        -- Filter by game: Match direct code OR handles legacy MTG labels
        AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
        AND (set_filter IS NULL OR p.set_name = ANY(set_filter))
        AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
        AND (color_filter IS NULL OR p.colors && color_filter)
        AND (NOT p_only_new OR NOT v_has_recent OR p.updated_at >= NOW() - INTERVAL '12 days')
        AND (year_from IS NULL OR EXTRACT(YEAR FROM p.release_date) >= year_from)
        AND (year_to IS NULL OR EXTRACT(YEAR FROM p.release_date) <= year_to)
        AND (price_min IS NULL OR p.price_usd >= price_min)
        AND (price_max IS NULL OR p.price_usd <= price_max)
        AND (type_filter IS NULL OR EXISTS (SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'))
    ORDER BY
        -- Relevance sort if searching
        CASE 
            WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
            WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
            ELSE 2 END ASC,
        -- Dynamic sort criteria
        CASE WHEN v_sort_by = 'newest' THEN p.updated_at END DESC,
        CASE WHEN v_sort_by = 'price_asc' THEN p.price_usd END ASC,
        CASE WHEN v_sort_by = 'price_desc' THEN p.price_usd END DESC,
        CASE WHEN v_sort_by = 'name' THEN p.name END ASC,
        CASE WHEN v_sort_by = 'name_desc' THEN p.name END DESC,
        CASE WHEN v_sort_by = 'release_date' THEN p.release_date END DESC,
        CASE WHEN v_sort_by = 'release_date_asc' THEN p.release_date END ASC,
        p.updated_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
