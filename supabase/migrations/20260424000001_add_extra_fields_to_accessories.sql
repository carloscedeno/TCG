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

-- 2. Update get_accessories_filtered RPC to include new fields
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id integer DEFAULT NULL,
    p_category text DEFAULT NULL,
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
    language text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.name, a.description, a.price, a.stock, a.image_url, a.category, a.game_id, a.created_at,
        a.cost, a.suggested_price, a.unit_type, a.language
    FROM public.accessories a
    WHERE a.is_active = true
      AND (p_game_id IS NULL OR a.game_id = p_game_id)
      AND (p_category IS NULL OR a.category = p_category)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

COMMIT;
