-- Migration: Add rarity and card type filtering to get_inventory_list RPC
-- Description: Extends get_inventory_list to filter by p_rarity and p_card_type.

CREATE OR REPLACE FUNCTION public.get_inventory_list(
    p_page integer,
    p_page_size integer,
    p_search text DEFAULT NULL::text,
    p_game text DEFAULT NULL::text,
    p_condition text DEFAULT NULL::text,
    p_sort_by text DEFAULT 'name'::text,
    p_sort_order text DEFAULT 'asc'::text,
    p_only_new boolean DEFAULT false,
    p_set_code text DEFAULT NULL::text,
    p_rarity text DEFAULT NULL::text,
    p_card_type text DEFAULT NULL::text
)
RETURNS TABLE(
    product_id uuid,
    printing_id text,
    name text,
    game text,
    set_code text,
    condition text,
    finish text,
    price numeric,
    stock integer,
    image_url text,
    rarity text,
    updated_at timestamp with time zone,
    total_count bigint,
    discount_percentage numeric,
    discount_end_date timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    v_offset INTEGER := p_page * p_page_size;
    v_has_recent BOOLEAN;
    v_new_sets TEXT[];
BEGIN
    -- Dynamically fetch set codes for products created in the last 14 days
    SELECT COALESCE(array_agg(DISTINCT LOWER(prd.set_code)), ARRAY[]::text[])
    INTO v_new_sets
    FROM public.products prd
    WHERE prd.created_at >= NOW() - INTERVAL '14 days' AND prd.set_code IS NOT NULL;

    -- Fallback to Strixhaven + Marvel sets if no new sets are found
    IF array_length(v_new_sets, 1) IS NULL OR array_length(v_new_sets, 1) = 0 THEN
        v_new_sets := ARRAY['sos', 'soa', 'soc', 'tsos', 'msh', 'msc', 'mar'];
    END IF;

    IF p_only_new THEN
        SELECT EXISTS (
            SELECT 1 FROM public.products p
            WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
              AND (p_game IS NULL OR p.game = p_game)
              AND (p_condition IS NULL OR p.condition = p_condition)
              AND (p_set_code IS NULL OR p.set_code = p_set_code)
              AND (p_rarity IS NULL OR LOWER(COALESCE(p.rarity, '')) = LOWER(p_rarity))
              AND (p_card_type IS NULL OR p.type_line ILIKE '%' || p_card_type || '%')
              AND LOWER(p.set_code) = ANY(v_new_sets)
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
            COALESCE(p.finish, 'nonfoil') as finish,
            p.price,
            p.stock,
            p.image_url,
            p.rarity,
            p.updated_at,
            p.discount_percentage,
            p.discount_end_date
        FROM public.products p
        WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
          AND (p_game IS NULL OR p.game = p_game)
          AND (p_condition IS NULL OR p.condition = p_condition)
          AND (p_set_code IS NULL OR p.set_code = p_set_code)
          AND (p_rarity IS NULL OR LOWER(COALESCE(p.rarity, '')) = LOWER(p_rarity))
          AND (p_card_type IS NULL OR p.type_line ILIKE '%' || p_card_type || '%')
          AND (NOT p_only_new OR NOT v_has_recent OR LOWER(p.set_code) = ANY(v_new_sets))
    ),
    total_c AS (
        SELECT COUNT(*) as full_count FROM filtered_inventory
    )
    SELECT 
        fi.product_id, fi.printing_id, fi.name, fi.game, fi.set_code, 
        fi.condition, fi.finish, fi.price, fi.stock, fi.image_url, fi.rarity, 
        fi.updated_at, tc.full_count, fi.discount_percentage, fi.discount_end_date
    FROM filtered_inventory fi
    CROSS JOIN total_c tc
    ORDER BY 
        CASE WHEN p_sort_by = 'newest' THEN fi.updated_at END DESC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN fi.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN fi.name END DESC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN fi.price END ASC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN fi.price END DESC,
        CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' THEN fi.stock END ASC,
        CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' THEN fi.stock END DESC,
        fi.updated_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$;
