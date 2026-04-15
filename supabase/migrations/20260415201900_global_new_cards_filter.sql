-- Migration: Global New Cards Filter and updated_at logic
-- Created: 2026-04-15
-- Author: Antigravity

-- 1. Update get_inventory_list to use updated_at and support p_only_new
DROP FUNCTION IF EXISTS public.get_inventory_list(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_inventory_list(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_inventory_list(
    p_page INTEGER,
    p_page_size INTEGER,
    p_search TEXT DEFAULT NULL,
    p_game TEXT DEFAULT NULL,
    p_condition TEXT DEFAULT NULL,
    p_set_code TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'name',
    p_sort_order TEXT DEFAULT 'asc',
    p_only_new BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    product_id UUID,
    printing_id TEXT,
    name TEXT,
    game TEXT,
    set_code TEXT,
    condition TEXT,
    price NUMERIC,
    stock INTEGER,
    image_url TEXT,
    rarity TEXT,
    updated_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER := p_page * p_page_size;
    v_has_recent BOOLEAN;
BEGIN
    IF p_only_new THEN
        SELECT EXISTS (
            SELECT 1 FROM public.products p
            WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
              AND (p_game IS NULL OR p.game = p_game)
              AND (p_condition IS NULL OR p.condition = p_condition)
              AND (p_set_code IS NULL OR p.set_code = p_set_code)
              AND p.updated_at >= NOW() - INTERVAL '12 days'
        ) INTO v_has_recent;
    ELSE
        v_has_recent := FALSE;
    END IF;

    RETURN QUERY
    WITH filtered_inventory AS (
        SELECT 
            p.id as product_id,
            p.printing_id::text,
            p.name,
            p.game,
            p.set_code,
            p.condition,
            p.price,
            p.stock,
            p.image_url,
            p.rarity,
            p.updated_at
        FROM public.products p
        WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
          AND (p_game IS NULL OR p.game = p_game)
          AND (p_condition IS NULL OR p.condition = p_condition)
          AND (p_set_code IS NULL OR p.set_code = p_set_code)
          AND (NOT p_only_new OR NOT v_has_recent OR p.updated_at >= NOW() - INTERVAL '12 days')
    ),
    total_c AS (
        SELECT COUNT(*) as full_count FROM filtered_inventory
    )
    SELECT 
        fi.product_id, fi.printing_id, fi.name, fi.game, fi.set_code, 
        fi.condition, fi.price, fi.stock, fi.image_url, fi.rarity, 
        fi.updated_at, tc.full_count
    FROM filtered_inventory fi
    CROSS JOIN total_c tc
    ORDER BY 
        CASE WHEN p_only_new OR p_sort_by = 'newest' THEN fi.updated_at END DESC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'name' AND p_sort_order = 'asc' THEN fi.name END ASC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'name' AND p_sort_order = 'desc' THEN fi.name END DESC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'price' AND p_sort_order = 'asc' THEN fi.price END ASC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'price' AND p_sort_order = 'desc' THEN fi.price END DESC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'stock' AND p_sort_order = 'asc' THEN fi.stock END ASC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'stock' AND p_sort_order = 'desc' THEN fi.stock END DESC,
        fi.updated_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- 2. Update get_products_filtered to support p_only_new and updated_at return
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
              IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN v_game_code := 'MTG';
              ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' THEN v_game_code := 'POKEMON';
              ELSE v_game_code := game_filter; END IF;

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
                CASE WHEN p_only_new OR v_sort_by = 'newest' THEN p.updated_at END DESC,
                CASE 
                    WHEN NOT p_only_new AND search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
                    WHEN NOT p_only_new AND search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
                    ELSE 2 END ASC,
                CASE WHEN NOT p_only_new AND v_sort_by = 'price_asc' THEN p.price_usd END ASC,
                CASE WHEN NOT p_only_new AND v_sort_by = 'price_desc' THEN p.price_usd END DESC,
                CASE WHEN NOT p_only_new AND v_sort_by = 'name' THEN p.name END ASC,
                CASE WHEN NOT p_only_new AND v_sort_by = 'name_desc' THEN p.name END DESC,
                CASE WHEN NOT p_only_new AND v_sort_by = 'release_date' THEN p.release_date END DESC,
                CASE WHEN NOT p_only_new AND v_sort_by = 'release_date_asc' THEN p.release_date END ASC,
                p.updated_at DESC
              LIMIT limit_count
              OFFSET offset_count;
            END;
$$ LANGUAGE plpgsql;
