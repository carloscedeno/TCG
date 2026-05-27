-- Fix get_accessories_filtered to correctly handle OTHERS filter
DO $$ 
DECLARE
  func_record RECORD;
BEGIN
  -- We just recreate it since it's a simple OR REPLACE
END $$;

CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id       integer  DEFAULT NULL,
    p_game_code     text     DEFAULT NULL,
    p_category      text     DEFAULT NULL,
    p_category_code text     DEFAULT NULL,
    p_parent_code   text     DEFAULT NULL,
    p_search_query  text     DEFAULT NULL,
    p_price_min     numeric  DEFAULT NULL,
    p_price_max     numeric  DEFAULT NULL,
    p_only_discount boolean  DEFAULT false,
    p_only_presale  boolean  DEFAULT false,
    p_sort          text     DEFAULT 'newest',
    p_limit         integer  DEFAULT 50,
    p_offset        integer  DEFAULT 0
)
RETURNS TABLE (
    id              uuid,
    name            text,
    description     text,
    price           numeric,
    stock           integer,
    image_url       text,
    additional_images text[],
    category        text,
    category_code   text,
    category_name   text,
    category_icon   text,
    game_id         integer,
    created_at      timestamptz,
    cost            numeric,
    suggested_price numeric,
    unit_type       text,
    language        text,
    discount_percentage numeric,
    discount_until  timestamptz,
    is_active       boolean,
    total_count     bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT
            a.id, a.name, a.description, a.price, a.stock, a.image_url, a.additional_images,
            a.category, a.category_code,
            ac.name AS category_name,
            ac.icon AS category_icon,
            a.game_id, a.created_at,
            a.cost, a.suggested_price, a.unit_type, a.language,
            a.discount_percentage, a.discount_until, a.is_active
        FROM public.accessories a
        LEFT JOIN public.accessory_categories ac ON a.category_code = ac.code
        LEFT JOIN public.games g ON a.game_id = g.game_id
        WHERE a.is_active = true
          AND (
              (p_game_code = 'OTHERS' AND a.game_id IS NULL)
              OR
              (COALESCE(p_game_code, '') != 'OTHERS' AND (p_game_id IS NULL OR a.game_id = p_game_id OR (p_game_code IS NOT NULL AND (g.game_code ILIKE p_game_code OR g.game_name ILIKE p_game_code))))
          )
          AND (p_category IS NULL OR a.category ILIKE '%' || p_category || '%')
          AND (p_category_code IS NULL OR a.category_code = p_category_code)
          AND (
              p_parent_code IS NULL
              OR a.category_code = p_parent_code
              OR EXISTS (
                  SELECT 1 FROM public.accessory_categories child
                  WHERE child.code = a.category_code
                    AND child.parent_code = p_parent_code
              )
          )
          AND (
              p_search_query IS NULL
              OR a.name ILIKE '%' || p_search_query || '%'
              OR a.description ILIKE '%' || p_search_query || '%'
              OR a.category ILIKE '%' || p_search_query || '%'
          )
          AND (p_price_min IS NULL OR (CASE WHEN a.discount_percentage > 0 AND a.discount_until > now() THEN a.price * (1 - a.discount_percentage / 100.0) ELSE a.price END) >= p_price_min)
          AND (p_price_max IS NULL OR (CASE WHEN a.discount_percentage > 0 AND a.discount_until > now() THEN a.price * (1 - a.discount_percentage / 100.0) ELSE a.price END) <= p_price_max)
          AND (NOT p_only_discount OR (a.discount_percentage > 0 AND a.discount_until IS NOT NULL AND a.discount_until > now()))
          AND (NOT p_only_presale OR (a.name ILIKE '%(preventa)%' OR a.category_code = 'PRESALE' OR a.category ILIKE '%preventa%'))
    ),
    total AS (
        SELECT count(*) AS full_count FROM filtered_data
    )
    SELECT
        f.id, f.name, f.description, f.price, f.stock, f.image_url, f.additional_images,
        f.category, f.category_code, f.category_name, f.category_icon,
        f.game_id, f.created_at,
        f.cost, f.suggested_price, f.unit_type, f.language,
        f.discount_percentage, f.discount_until, f.is_active,
        t.full_count
    FROM filtered_data f, total t
    ORDER BY
        CASE WHEN p_sort = 'price_asc' THEN (CASE WHEN f.discount_percentage > 0 AND f.discount_until > now() THEN f.price * (1 - f.discount_percentage / 100.0) ELSE f.price END) END ASC,
        CASE WHEN p_sort = 'price_desc' THEN (CASE WHEN f.discount_percentage > 0 AND f.discount_until > now() THEN f.price * (1 - f.discount_percentage / 100.0) ELSE f.price END) END DESC,
        CASE WHEN p_sort = 'name' THEN f.name END ASC,
        CASE WHEN p_sort = 'newest' THEN f.created_at END DESC NULLS LAST,
        f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_accessories_filtered(integer, text, text, text, text, text, numeric, numeric, boolean, boolean, text, integer, integer) TO anon, authenticated;
