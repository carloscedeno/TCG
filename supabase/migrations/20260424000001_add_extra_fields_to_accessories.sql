-- Migration: Add extra fields to accessories table
-- Date: 2026-04-24
-- Description: Adds cost, suggested_price, unit_type, and language to support full inventory data.

BEGIN;

-- 1. Add columns to accessories table
ALTER TABLE public.accessories 
ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0 CHECK (cost >= 0),
ADD COLUMN IF NOT EXISTS suggested_price numeric DEFAULT 0 CHECK (suggested_price >= 0),
ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'Unidad', -- 'Unidad', 'Sellado', 'Caja', etc.
ADD COLUMN IF NOT EXISTS language text; -- 'Español', 'Inglés', 'Japonés', etc.

-- 2. Update get_accessories_filtered RPC to include new fields and match frontend signature
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer, text, text, numeric, numeric, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id integer DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_search_query text DEFAULT NULL,
    p_price_min numeric DEFAULT NULL,
    p_price_max numeric DEFAULT NULL,
    p_sort text DEFAULT 'newest',
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
    cost numeric,
    suggested_price numeric,
    unit_type text,
    language text,
    total_count bigint
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
            a.id, a.name, a.description, a.price, a.stock, a.image_url, a.category, a.game_id, a.created_at,
            a.cost, a.suggested_price, a.unit_type, a.language
        FROM public.accessories a
        WHERE a.is_active = true
          AND (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL)
          AND (p_category IS NULL OR a.category = p_category)
          AND (p_search_query IS NULL OR a.name ILIKE '%' || p_search_query || '%' OR a.description ILIKE '%' || p_search_query || '%')
          AND (p_price_min IS NULL OR a.price >= p_price_min)
          AND (p_price_max IS NULL OR a.price <= p_price_max)
    ),
    total AS (
        SELECT count(*) as full_count FROM filtered_data
    )
    SELECT 
        f.*,
        t.full_count
    FROM filtered_data f, total t
    ORDER BY 
        CASE WHEN p_sort = 'price_asc' THEN f.price END ASC,
        CASE WHEN p_sort = 'price_desc' THEN f.price END DESC,
        CASE WHEN p_sort = 'newest' THEN f.created_at END DESC NULLS LAST,
        f.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 3. Restore list_user_carts RPC (Fixing 404 errors in storefront)
DROP FUNCTION IF EXISTS public.list_user_carts(boolean);
CREATE OR REPLACE FUNCTION public.list_user_carts(p_is_pos boolean DEFAULT false)
RETURNS TABLE (
    id uuid,
    name text,
    is_active boolean,
    is_pos boolean,
    item_count bigint,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.is_active,
        c.is_pos,
        COALESCE(SUM(ci.quantity), 0)::bigint as item_count,
        c.updated_at
    FROM public.carts c
    LEFT JOIN public.cart_items ci ON c.id = ci.cart_id
    WHERE c.user_id = auth.uid()
      AND (p_is_pos = false OR c.is_pos = true)
    GROUP BY c.id, c.name, c.is_active, c.is_pos, c.updated_at
    ORDER BY c.is_active DESC, c.updated_at DESC;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_accessories_filtered(integer, text, text, numeric, numeric, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_user_carts(boolean) TO authenticated;

COMMIT;
