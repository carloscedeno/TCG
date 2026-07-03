-- Migration: Bulk Rarity Discounts
-- Description: Adds RPCs for applying and clearing discounts in bulk by rarity.

-- 1. RPC to apply discount by rarity
CREATE OR REPLACE FUNCTION public.admin_apply_discount_by_rarity(
    p_rarity text,
    p_discount_percentage numeric,
    p_discount_until timestamptz,
    p_overwrite_existing boolean DEFAULT false,
    p_include_foil boolean DEFAULT false,
    p_game text DEFAULT 'MTG'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count integer;
BEGIN
    -- Validate user is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF p_discount_percentage <= 0 THEN
        RAISE EXCEPTION 'Discount percentage must be greater than 0';
    END IF;

    -- Insert into history for tracking
    INSERT INTO public.product_offers_history (product_id, discount_percentage, end_date, is_active, created_by)
    SELECT id, p_discount_percentage, p_discount_until, true, auth.uid()
    FROM public.products
    WHERE LOWER(COALESCE(rarity, '')) = LOWER(p_rarity)
      AND stock > 0
      AND price > 0
      AND game = p_game
      AND (p_include_foil = true OR LOWER(COALESCE(finish, 'nonfoil')) = 'nonfoil')
      AND (p_overwrite_existing = true OR (COALESCE(discount_percentage, 0) = 0 AND discount_end_date IS NULL));

    -- Update products table
    UPDATE public.products
    SET discount_percentage = p_discount_percentage,
        discount_end_date = p_discount_until
    WHERE LOWER(COALESCE(rarity, '')) = LOWER(p_rarity)
      AND stock > 0
      AND price > 0
      AND game = p_game
      AND (p_include_foil = true OR LOWER(COALESCE(finish, 'nonfoil')) = 'nonfoil')
      AND (p_overwrite_existing = true OR (COALESCE(discount_percentage, 0) = 0 AND discount_end_date IS NULL));
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object('success', true, 'updated_count', v_updated_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. RPC to clear discount by rarity
CREATE OR REPLACE FUNCTION public.admin_clear_discount_by_rarity(
    p_rarity text,
    p_game text DEFAULT 'MTG'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count integer;
BEGIN
    -- Validate user is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- End previous active offers in history
    UPDATE public.product_offers_history poh
    SET is_active = false
    FROM public.products p
    WHERE poh.product_id = p.id
      AND poh.is_active = true
      AND LOWER(COALESCE(p.rarity, '')) = LOWER(p_rarity)
      AND p.game = p_game
      AND (COALESCE(p.discount_percentage, 0) > 0 OR p.discount_end_date IS NOT NULL);

    -- Clear discounts on products table
    UPDATE public.products
    SET discount_percentage = 0,
        discount_end_date = null
    WHERE LOWER(COALESCE(rarity, '')) = LOWER(p_rarity)
      AND game = p_game
      AND (COALESCE(discount_percentage, 0) > 0 OR discount_end_date IS NOT NULL);
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object('success', true, 'updated_count', v_updated_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
