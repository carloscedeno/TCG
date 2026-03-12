-- Migration: fix_rpc_cart_clearing
-- Description: Fixes the 'column user_id does not exist' error in create_order_atomic

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id UUID,
    p_items JSONB,
    p_shipping_address JSONB,
    p_total_amount NUMERIC,
    p_guest_info JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_price NUMERIC;
    v_current_stock INTEGER;
    v_product_name TEXT;
    v_finish TEXT;
    v_is_on_demand BOOLEAN;
    v_cart_id UUID;
BEGIN
    -- 1. Create Order
    INSERT INTO public.orders (
        user_id,
        total_amount,
        status,
        shipping_address,
        guest_info
    ) VALUES (
        p_user_id,
        p_total_amount,
        'pending_verification',
        p_shipping_address,
        p_guest_info
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'price')::NUMERIC;
        v_finish := (v_item->>'finish');
        v_is_on_demand := COALESCE((v_item->>'is_on_demand')::BOOLEAN, false);

        -- Check Stock
        SELECT stock, name INTO v_current_stock, v_product_name 
        FROM public.products 
        WHERE id = v_product_id FOR UPDATE;
        
        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        -- Check and update stock
        IF NOT v_is_on_demand THEN
            IF v_current_stock < v_quantity THEN
                 RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', v_product_name, v_current_stock, v_quantity;
            END IF;
            
            UPDATE public.products 
            SET stock = stock - v_quantity
            WHERE id = v_product_id;
        ELSE
            IF v_current_stock > 0 THEN
                UPDATE public.products 
                SET stock = GREATEST(0, stock - v_quantity)
                WHERE id = v_product_id;
            END IF;
        END IF;

        -- Record Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            product_name,
            finish,
            is_on_demand
        ) VALUES (
            v_order_id,
            v_product_id,
            v_quantity,
            v_price,
            v_product_name,
            v_finish,
            v_is_on_demand
        );
    END LOOP;

    -- 3. Clear Cart for logged-in users (FIXED: cart_items has cart_id, not user_id)
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id;
        IF v_cart_id IS NOT NULL THEN
            DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
