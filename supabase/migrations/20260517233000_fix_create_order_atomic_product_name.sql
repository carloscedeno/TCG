-- Migration: Fix create_order_atomic to include mandatory product_name and printing details
-- Date: 2026-05-17
-- Description: Updates create_order_atomic to insert product_name (NOT NULL constraint), printing_id, finish, and set_code into order_items.

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_items jsonb, -- Array of {product_id?: uuid, accessory_id?: uuid, quantity: int, price: numeric, is_on_demand?: boolean, name?: text, printing_id?: uuid, finish?: text, set?: text}
    p_shipping_address jsonb,
    p_total_amount numeric,
    p_guest_info jsonb DEFAULT NULL,
    p_cart_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_cart_id uuid := p_cart_id;
    v_real_price numeric;
    v_current_stock integer;
    v_target_id uuid;
    v_acc_id uuid;
    v_is_on_demand boolean;
    v_product_name text;
    v_printing_id uuid;
    v_finish text;
    v_set_code text;
BEGIN
    -- 1. Create the main order with correct status 'pending_verification'
    INSERT INTO public.orders (
        user_id, 
        total_amount, 
        status, 
        shipping_address,
        guest_info,
        created_at
    )
    VALUES (
        p_user_id, 
        p_total_amount, 
        'pending_verification', 
        p_shipping_address,
        p_guest_info,
        now()
    )
    RETURNING id INTO v_order_id;

    -- 2. Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Safe extraction of IDs
        v_target_id := NULLIF(v_item->>'product_id', 'null')::uuid;
        v_acc_id := NULLIF(v_item->>'accessory_id', 'null')::uuid;
        v_is_on_demand := COALESCE((v_item->>'is_on_demand')::boolean, false);
        v_real_price := NULL;
        v_current_stock := NULL;
        v_product_name := NULL;
        v_printing_id := NULL;
        v_finish := NULL;
        v_set_code := NULL;

        -- A. Try as PRODUCT if product_id is provided
        IF v_target_id IS NOT NULL THEN
            SELECT stock, price, name, printing_id, finish, set_code 
            INTO v_current_stock, v_real_price, v_product_name, v_printing_id, v_finish, v_set_code
            FROM public.products 
            WHERE id = v_target_id;

            -- Fallback: If not found in products, check if it's actually an accessory ID
            IF v_current_stock IS NULL THEN
                SELECT stock, price, name 
                INTO v_current_stock, v_real_price, v_product_name 
                FROM public.accessories 
                WHERE id = v_target_id;
                
                IF v_current_stock IS NOT NULL THEN
                    v_acc_id := v_target_id;
                    v_target_id := NULL;
                END IF;
            END IF;
        END IF;

        -- B. Try as ACCESSORY if accessory_id is provided OR if re-routed from product
        IF v_target_id IS NULL AND v_acc_id IS NOT NULL THEN
            SELECT stock, price, name 
            INTO v_current_stock, v_real_price, v_product_name 
            FROM public.accessories 
            WHERE id = v_acc_id;
        END IF;

        -- C. Execute Insertion & Stock Decrement (allowing On-Demand)
        IF v_target_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            -- Auto-detect on demand if not explicitly sent but stock is low
            IF NOT v_is_on_demand AND v_current_stock < (v_item->>'quantity')::integer THEN
                v_is_on_demand := true;
            END IF;

            -- Fallback metadata from incoming JSON if table columns were null
            v_product_name := COALESCE(v_product_name, v_item->>'name', 'Producto sin nombre');
            v_printing_id := COALESCE(v_printing_id, NULLIF(v_item->>'printing_id', 'null')::uuid);
            v_finish := COALESCE(v_finish, v_item->>'finish', 'nonfoil');
            v_set_code := COALESCE(v_set_code, v_item->>'set', v_item->>'set_code');

            INSERT INTO public.order_items (order_id, product_id, printing_id, product_name, quantity, price_at_purchase, is_on_demand, finish, set_code)
            VALUES (v_order_id, v_target_id, v_printing_id, v_product_name, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric), v_is_on_demand, v_finish, v_set_code);

            -- Update stock (floor at 0)
            UPDATE public.products SET stock = GREATEST(0, stock - (v_item->>'quantity')::integer) WHERE id = v_target_id;

        ELSIF v_acc_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            -- Auto-detect on demand for accessories too
            IF NOT v_is_on_demand AND v_current_stock < (v_item->>'quantity')::integer THEN
                v_is_on_demand := true;
            END IF;

            v_product_name := COALESCE(v_product_name, v_item->>'name', 'Accesorio sin nombre');

            INSERT INTO public.order_items (order_id, accessory_id, product_name, quantity, price_at_purchase, is_on_demand)
            VALUES (v_order_id, v_acc_id, v_product_name, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric), v_is_on_demand);

            UPDATE public.accessories SET stock = GREATEST(0, stock - (v_item->>'quantity')::integer) WHERE id = v_acc_id;
        
        ELSE
            RAISE EXCEPTION 'Item de orden inválido o no encontrado: %', COALESCE(v_item->>'name', v_item->>'id');
        END IF;
    END LOOP;

    -- 3. Cleanup Cart
    IF v_cart_id IS NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id AND is_active = true LIMIT 1;
    END IF;

    IF v_cart_id IS NOT NULL THEN
        DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb, uuid) TO anon, authenticated;
