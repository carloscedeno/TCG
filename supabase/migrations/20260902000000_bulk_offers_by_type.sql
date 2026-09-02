-- Migration: Bulk Offers by Rarity and/or Card Type
-- Description: Extends RPCs for applying and clearing discounts in bulk by rarity, card type, or both.

-- 1. Updated RPC to apply discount by rarity and/or card type
CREATE OR REPLACE FUNCTION public.admin_apply_discount_by_rarity(
    p_rarity text DEFAULT NULL,
    p_discount_percentage numeric DEFAULT 0,
    p_discount_until timestamptz DEFAULT NULL,
    p_overwrite_existing boolean DEFAULT false,
    p_include_foil boolean DEFAULT false,
    p_game text DEFAULT 'MTG',
    p_card_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count integer;
    v_rarity_clean text;
    v_type_clean text;
BEGIN
    -- Validate user is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF p_discount_percentage <= 0 THEN
        RAISE EXCEPTION 'Discount percentage must be greater than 0';
    END IF;

    v_rarity_clean := NULLIF(TRIM(p_rarity), '');
    IF v_rarity_clean = 'ALL' OR v_rarity_clean = 'all' THEN
        v_rarity_clean := NULL;
    END IF;

    v_type_clean := NULLIF(TRIM(p_card_type), '');
    IF v_type_clean = 'ALL' OR v_type_clean = 'all' THEN
        v_type_clean := NULL;
    END IF;

    IF v_rarity_clean IS NULL AND v_type_clean IS NULL THEN
        RAISE EXCEPTION 'Must select at least a rarity or a card type';
    END IF;

    -- Insert into history for tracking
    INSERT INTO public.product_offers_history (product_id, discount_percentage, end_date, is_active, created_by)
    SELECT id, p_discount_percentage, p_discount_until, true, auth.uid()
    FROM public.products
    WHERE stock > 0
      AND price > 0
      AND game = p_game
      AND (v_rarity_clean IS NULL OR LOWER(COALESCE(rarity, '')) = LOWER(v_rarity_clean))
      AND (v_type_clean IS NULL OR type_line ILIKE '%' || v_type_clean || '%')
      AND (p_include_foil = true OR LOWER(COALESCE(finish, 'nonfoil')) = 'nonfoil')
      AND (p_overwrite_existing = true OR (COALESCE(discount_percentage, 0) = 0 AND discount_end_date IS NULL));

    -- Update products table
    UPDATE public.products
    SET discount_percentage = p_discount_percentage,
        discount_end_date = p_discount_until
    WHERE stock > 0
      AND price > 0
      AND game = p_game
      AND (v_rarity_clean IS NULL OR LOWER(COALESCE(rarity, '')) = LOWER(v_rarity_clean))
      AND (v_type_clean IS NULL OR type_line ILIKE '%' || v_type_clean || '%')
      AND (p_include_foil = true OR LOWER(COALESCE(finish, 'nonfoil')) = 'nonfoil')
      AND (p_overwrite_existing = true OR (COALESCE(discount_percentage, 0) = 0 AND discount_end_date IS NULL));
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object('success', true, 'updated_count', v_updated_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 2. Updated RPC to clear discount by rarity and/or card type
CREATE OR REPLACE FUNCTION public.admin_clear_discount_by_rarity(
    p_rarity text DEFAULT NULL,
    p_game text DEFAULT 'MTG',
    p_card_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count integer;
    v_rarity_clean text;
    v_type_clean text;
BEGIN
    -- Validate user is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    v_rarity_clean := NULLIF(TRIM(p_rarity), '');
    IF v_rarity_clean = 'ALL' OR v_rarity_clean = 'all' THEN
        v_rarity_clean := NULL;
    END IF;

    v_type_clean := NULLIF(TRIM(p_card_type), '');
    IF v_type_clean = 'ALL' OR v_type_clean = 'all' THEN
        v_type_clean := NULL;
    END IF;

    IF v_rarity_clean IS NULL AND v_type_clean IS NULL THEN
        RAISE EXCEPTION 'Must select at least a rarity or a card type to clear discounts';
    END IF;

    -- End previous active offers in history
    UPDATE public.product_offers_history poh
    SET is_active = false
    FROM public.products p
    WHERE poh.product_id = p.id
      AND poh.is_active = true
      AND p.game = p_game
      AND (v_rarity_clean IS NULL OR LOWER(COALESCE(p.rarity, '')) = LOWER(v_rarity_clean))
      AND (v_type_clean IS NULL OR p.type_line ILIKE '%' || v_type_clean || '%')
      AND (COALESCE(p.discount_percentage, 0) > 0 OR p.discount_end_date IS NOT NULL);

    -- Clear discounts on products table
    UPDATE public.products
    SET discount_percentage = 0,
        discount_end_date = null
    WHERE game = p_game
      AND (v_rarity_clean IS NULL OR LOWER(COALESCE(rarity, '')) = LOWER(v_rarity_clean))
      AND (v_type_clean IS NULL OR type_line ILIKE '%' || v_type_clean || '%')
      AND (COALESCE(discount_percentage, 0) > 0 OR discount_end_date IS NOT NULL);
      
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object('success', true, 'updated_count', v_updated_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
