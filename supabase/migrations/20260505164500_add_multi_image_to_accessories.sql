-- Migration: Add additional_images to accessories
-- Date: 2026-05-05

BEGIN;

-- 1. Add column to accessories table
ALTER TABLE public.accessories 
ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT '{}';

-- 2. Update get_accessories_filtered RPC to include additional_images
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
    additional_images text[],
    category text,
    game_id integer,
    created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.name, a.description, a.price, a.stock, a.image_url, a.additional_images, a.category, a.game_id, a.created_at
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
