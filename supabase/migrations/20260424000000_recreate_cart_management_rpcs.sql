-- Migration: Recreate Cart Management RPCs
-- Date: 2026-04-24
-- Description: Restores missing update_cart_item_quantity and remove_from_cart functions.

BEGIN;

-- 1. update_cart_item_quantity
CREATE OR REPLACE FUNCTION public.update_cart_item_quantity(
    p_cart_item_id uuid,
    p_new_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_user_id uuid;
    v_cart_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Verify ownership
    SELECT cart_id INTO v_cart_id 
    FROM cart_items 
    WHERE id = p_cart_item_id;
    
    -- If no user is logged in, we check if it's a guest item (handled in frontend usually)
    -- but this RPC is only for authenticated users as per frontend logic
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM carts WHERE id = v_cart_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    
    -- Update quantity
    IF p_new_quantity > 0 THEN
        UPDATE cart_items 
        SET quantity = p_new_quantity,
            updated_at = now()
        WHERE id = p_cart_item_id;
    ELSE
        DELETE FROM cart_items WHERE id = p_cart_item_id;
    END IF;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 2. remove_from_cart
CREATE OR REPLACE FUNCTION public.remove_from_cart(
    p_cart_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_cart_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    -- Verify ownership
    SELECT cart_id INTO v_cart_id 
    FROM cart_items 
    WHERE id = p_cart_item_id;
    
    IF NOT EXISTS (SELECT 1 FROM carts WHERE id = v_cart_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    
    DELETE FROM cart_items WHERE id = p_cart_item_id;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.update_cart_item_quantity(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_cart(uuid) TO authenticated;

COMMIT;
