-- Multi-Cart stabilization - Unifying RPCs for Terminal v25
-- Target: Fix NaN errors and data mismatches between frontend and backend.

-- 1. Update carts table to ensure consistent schema
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS is_pos boolean DEFAULT false;

-- 2. Enhanced list_user_carts with POS filter
DROP FUNCTION IF EXISTS public.list_user_carts();
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

-- 3. Enhanced create_named_cart with is_pos support
DROP FUNCTION IF EXISTS public.create_named_cart(text);
DROP FUNCTION IF EXISTS public.create_named_cart(text, boolean);

CREATE OR REPLACE FUNCTION public.create_named_cart(p_name text, p_is_pos boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_cart_id uuid;
BEGIN
    -- Deactivate other carts of the same type for this user
    UPDATE public.carts 
    SET is_active = false 
    WHERE user_id = auth.uid() AND is_pos = p_is_pos;

    INSERT INTO public.carts (user_id, name, is_active, is_pos)
    VALUES (auth.uid(), p_name, true, p_is_pos)
    RETURNING id INTO v_new_cart_id;

    RETURN v_new_cart_id;
END;
$$;

-- 4. Unified get_user_cart returning JSONB (Metadata + Items)
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);

CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
    v_cart_name text;
    v_is_pos boolean;
    v_items jsonb;
BEGIN
    -- Identify the active cart for the user
    SELECT id, name, is_pos INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;

    -- Fallback: If no active cart, pick the newest one
    IF v_cart_id IS NULL THEN
        SELECT id, name, is_pos INTO v_cart_id, v_cart_name, v_is_pos
        FROM public.carts 
        WHERE user_id = auth.uid()
        ORDER BY updated_at DESC
        LIMIT 1;
        
        -- If STILL null, creation is handled by frontend calling create or handled here?
        IF v_cart_id IS NULL THEN
            RETURN jsonb_build_object('items', '[]'::jsonb, 'id', null, 'name', 'Carrito Principal', 'is_pos', false);
        END IF;
        
        -- Mark as active if it was found via fallback
        UPDATE public.carts SET is_active = true WHERE id = v_cart_id;
    END IF;

    -- aggregate items with product details
    SELECT jsonb_agg(item_row) INTO v_items
    FROM (
        SELECT 
            ci.id as cart_item_id,
            ci.product_id,
            ci.quantity,
            p.printing_id,
            p.name as product_name,
            COALESCE(p.price, 0) as price,
            p.image_url,
            p.set_code,
            p.stock,
            p.finish
        FROM public.cart_items ci
        JOIN public.products p ON ci.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    ) item_row;

    RETURN jsonb_build_object(
        'id', v_cart_id,
        'name', v_cart_name,
        'is_pos', v_is_pos,
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

-- 5. Helper to clear active cart session for admins
DROP FUNCTION IF EXISTS public.clear_active_cart();
CREATE OR REPLACE FUNCTION public.clear_active_cart()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.carts 
    SET is_active = false 
    WHERE user_id = auth.uid() AND is_active = true;
END;
$$;

-- Grant permissions (ensure authenticated users can call these)
GRANT EXECUTE ON FUNCTION public.list_user_carts(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_named_cart(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_active_cart() TO authenticated;
