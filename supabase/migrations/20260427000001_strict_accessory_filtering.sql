-- Migration: Strict Accessory Filtering by Game
-- Date: 2026-04-27
-- Description: Makes the game filter strict. When a game_id is provided, 
--              it NO LONGER includes generic items (game_id IS NULL).

BEGIN;

CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id       integer  DEFAULT NULL,
    p_category      text     DEFAULT NULL,
    p_category_code text     DEFAULT NULL,
    p_parent_code   text     DEFAULT NULL,
    p_search_query  text     DEFAULT NULL,
    p_price_min     numeric  DEFAULT NULL,
    p_price_max     numeric  DEFAULT NULL,
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
            a.id, a.name, a.description, a.price, a.stock, a.image_url,
            a.category, a.category_code,
            ac.name   AS category_name,
            ac.icon   AS category_icon,
            a.game_id, a.created_at,
            a.cost, a.suggested_price, a.unit_type, a.language
        FROM public.accessories a
        LEFT JOIN public.accessory_categories ac ON a.category_code = ac.code
        WHERE
            a.is_active = true
            -- game filter (STRICT: only shows specified game or everything if NULL)
            AND (p_game_id IS NULL OR a.game_id = p_game_id)
            -- legacy category text filter
            AND (p_category IS NULL OR a.category ILIKE '%' || p_category || '%')
            -- new normalized category_code exact filter
            AND (p_category_code IS NULL OR a.category_code = p_category_code)
            -- parent group filter
            AND (
                p_parent_code IS NULL
                OR a.category_code = p_parent_code
                OR EXISTS (
                    SELECT 1 FROM public.accessory_categories child
                    WHERE child.code = a.category_code
                      AND child.parent_code = p_parent_code
                )
            )
            -- search
            AND (
                p_search_query IS NULL
                OR a.name        ILIKE '%' || p_search_query || '%'
                OR a.description ILIKE '%' || p_search_query || '%'
            )
            -- price range
            AND (p_price_min IS NULL OR a.price >= p_price_min)
            AND (p_price_max IS NULL OR a.price <= p_price_max)
    ),
    total AS (
        SELECT count(*) AS full_count FROM filtered_data
    )
    SELECT
        f.id, f.name, f.description, f.price, f.stock, f.image_url,
        f.category, f.category_code, f.category_name, f.category_icon,
        f.game_id, f.created_at,
        f.cost, f.suggested_price, f.unit_type, f.language,
        t.full_count
    FROM filtered_data f, total t
    ORDER BY
        CASE WHEN p_sort = 'price_asc'  THEN f.price       END ASC,
        CASE WHEN p_sort = 'price_desc' THEN f.price       END DESC,
        CASE WHEN p_sort = 'name'       THEN f.name        END ASC,
        CASE WHEN p_sort = 'newest'     THEN f.created_at  END DESC NULLS LAST,
        f.created_at DESC
    LIMIT  p_limit
    OFFSET p_offset;
END;
$$;

COMMIT;
