-- Migration: Enhance get_accessories_filtered RPC
-- Date: 2026-04-23
-- Description: Adds search, price range, and sorting to accessories filtering.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id integer DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_search_query text DEFAULT NULL,
    p_price_min numeric DEFAULT NULL,
    p_price_max numeric DEFAULT NULL,
    p_sort text DEFAULT 'created_at_desc',
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    price numeric,
    stock integer,
    image_url text,
    category text,
    game_id integer,
    created_at timestamptz,
    total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_acc AS (
        SELECT 
            a.id, a.name, a.description, a.price, a.stock, a.image_url, a.category, a.game_id, a.created_at
        FROM public.accessories a
        WHERE a.is_active = true
          AND (p_game_id IS NULL OR a.game_id = p_game_id)
          AND (p_category IS NULL OR a.category = p_category)
          AND (p_search_query IS NULL OR (a.name ILIKE '%' || p_search_query || '%' OR a.description ILIKE '%' || p_search_query || '%'))
          AND (p_price_min IS NULL OR a.price >= p_price_min)
          AND (p_price_max IS NULL OR a.price <= p_price_max)
    ),
    counted_acc AS (
        SELECT count(*) as full_count FROM filtered_acc
    )
    SELECT 
        f.id, f.name, f.description, f.price, f.stock, f.image_url, f.category, f.game_id, f.created_at,
        c.full_count as total_count
    FROM filtered_acc f, counted_acc c
    ORDER BY 
        CASE WHEN p_sort = 'name_asc' THEN f.name END ASC,
        CASE WHEN p_sort = 'name_desc' THEN f.name END DESC,
        CASE WHEN p_sort = 'price_asc' THEN f.price END ASC,
        CASE WHEN p_sort = 'price_desc' THEN f.price END DESC,
        CASE WHEN p_sort = 'created_at_asc' THEN f.created_at END ASC,
        CASE WHEN p_sort = 'created_at_desc' THEN f.created_at END DESC,
        f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant permissions (already granted in previous migration, but ensuring consistency)
GRANT EXECUTE ON FUNCTION public.get_accessories_filtered(integer, text, text, numeric, numeric, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessories_filtered(integer, text, text, numeric, numeric, text, integer, integer) TO anon;

COMMIT;
