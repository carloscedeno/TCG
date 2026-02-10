-- Migration: Cart Management Functions
-- Description: Add RPCs for updating cart item quantities and removing items from cart
-- Date: 2026-02-10

-- Function: Update Cart Item Quantity
-- Allows users to modify the quantity of items in their cart
-- Automatically deletes items if quantity is set to 0 or less
CREATE OR REPLACE FUNCTION public.update_cart_item_quantity(
    p_cart_item_id uuid,
    p_new_quantity integer
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
    
    -- Verify ownership
    SELECT cart_id INTO v_cart_id 
    FROM cart_items 
    WHERE id = p_cart_item_id;
    
    IF NOT EXISTS (SELECT 1 FROM carts WHERE id = v_cart_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    
    -- Update quantity or delete if <= 0
    IF p_new_quantity > 0 THEN
        UPDATE cart_items 
        SET quantity = p_new_quantity 
        WHERE id = p_cart_item_id;
    ELSE
        DELETE FROM cart_items WHERE id = p_cart_item_id;
    END IF;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Function: Remove Item from Cart
-- Allows users to completely remove an item from their cart
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_cart_item_quantity(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_cart(uuid) TO authenticated;
