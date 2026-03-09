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
    v_product_name TEXT; -- Added variable
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
        'pending', -- Default status
        p_shipping_address,
        p_guest_info
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'price')::NUMERIC;

        -- Check Stock
        SELECT stock, name INTO v_current_stock, v_product_name 
        FROM public.products 
        WHERE id = v_product_id FOR UPDATE;
        
        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF v_current_stock < v_quantity THEN
             RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
        END IF;

        -- Update Stock
        UPDATE public.products 
        SET stock = stock - v_quantity
        WHERE id = v_product_id;

        -- Record Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            product_name -- Insert product name
        ) VALUES (
            v_order_id,
            v_product_id,
            v_quantity,
            v_price,
            v_product_name
        );
    END LOOP;

    -- 3. Clear Cart for logged-in users
    IF p_user_id IS NOT NULL THEN
        DELETE FROM public.cart_items WHERE user_id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
