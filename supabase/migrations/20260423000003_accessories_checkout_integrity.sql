-- Migration: Enhance create_order_atomic and implement Accessory Inventory Integrity
-- Date: 2026-04-23
-- Description: Supports accessories in orders and auto-decrements stock.

BEGIN;

-- 1. CLEANUP: Drop existing overloads to avoid PGRST202 errors
-- We use a DO block to drop all functions named create_order_atomic in public schema
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT oid::regprocedure as sig FROM pg_proc WHERE proname = 'create_order_atomic' AND pronamespace = 'public'::regnamespace) 
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
    END LOOP;
END $$;

-- 2. Update get_user_cart to be polymorphic
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
    WHERE user_id = p_user_id AND is_active = true
    LIMIT 1;

    -- Fallback: If no active cart, pick the newest one
    IF v_cart_id IS NULL THEN
        SELECT id, name, is_pos INTO v_cart_id, v_cart_name, v_is_pos
        FROM public.carts 
        WHERE user_id = p_user_id
        ORDER BY updated_at DESC
        LIMIT 1;
        
        IF v_cart_id IS NULL THEN
            RETURN jsonb_build_object('items', '[]'::jsonb, 'id', null, 'name', 'Carrito Principal', 'is_pos', false);
        END IF;
        
        UPDATE public.carts SET is_active = true WHERE id = v_cart_id;
    END IF;

    -- aggregate items with product OR accessory details
    SELECT jsonb_agg(item_row) INTO v_items
    FROM (
        SELECT 
            ci.id as cart_item_id,
            ci.product_id,
            ci.accessory_id,
            ci.quantity,
            p.printing_id,
            COALESCE(p.name, a.name) as product_name,
            COALESCE(p.price, a.price, 0) as price,
            COALESCE(p.image_url, a.image_url) as image_url,
            COALESCE(p.set_code, a.category) as set_code,
            COALESCE(p.stock, a.stock, 0) as stock,
            COALESCE(p.finish, 'standard') as finish
        FROM public.cart_items ci
        LEFT JOIN public.products p ON ci.product_id = p.id
        LEFT JOIN public.accessories a ON ci.accessory_id = a.id
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

-- 3. Enhanced create_order_atomic to support accessories
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_items jsonb, -- Array of {product_id?: uuid, accessory_id?: uuid, quantity: int, price: numeric}
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
BEGIN
    -- 1. Create the main order
    INSERT INTO public.orders (
        user_id, 
        total_amount, 
        status, 
        shipping_address,
        created_at
    )
    VALUES (
        p_user_id, 
        p_total_amount, 
        'pending', 
        p_shipping_address,
        now()
    )
    RETURNING id INTO v_order_id;

    -- 2. Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Safe extraction of IDs (handling 'null' strings from some JS clients)
        v_target_id := NULLIF(v_item->>'product_id', 'null')::uuid;
        v_acc_id := NULLIF(v_item->>'accessory_id', 'null')::uuid;
        v_real_price := NULL;
        v_current_stock := NULL;

        -- A. Try as PRODUCT if product_id is provided
        IF v_target_id IS NOT NULL THEN
            SELECT stock, price INTO v_current_stock, v_real_price 
            FROM public.products 
            WHERE id = v_target_id;

            -- Fallback: If not found in products, check if it's actually an accessory ID
            IF v_current_stock IS NULL THEN
                SELECT stock, price INTO v_current_stock, v_real_price 
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
            SELECT stock, price INTO v_current_stock, v_real_price 
            FROM public.accessories 
            WHERE id = v_acc_id;
        END IF;

        -- C. Execute Insertion & Stock Decrement
        IF v_target_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            -- Validate stock
            IF v_current_stock < (v_item->>'quantity')::integer THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto %', (v_item->>'name');
            END IF;

            INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES (v_order_id, v_target_id, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric));

            UPDATE public.products SET stock = stock - (v_item->>'quantity')::integer WHERE id = v_target_id;

        ELSIF v_acc_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            -- Validate stock
            IF v_current_stock < (v_item->>'quantity')::integer THEN
                RAISE EXCEPTION 'Stock insuficiente para el accesorio %', (v_item->>'name');
            END IF;

            INSERT INTO public.order_items (order_id, accessory_id, quantity, price_at_purchase)
            VALUES (v_order_id, v_acc_id, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric));

            UPDATE public.accessories SET stock = stock - (v_item->>'quantity')::integer WHERE id = v_acc_id;
        
        ELSE
            RAISE EXCEPTION 'Item de orden inválido o no encontrado: % (P:% , A:%)', (v_item->>'name'), v_target_id, v_acc_id;
        END IF;
    END LOOP;

    -- 3. Cleanup Cart
    IF v_cart_id IS NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id AND is_active = true LIMIT 1;
    END IF;

    IF v_cart_id IS NOT NULL THEN
        DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
        -- Optional: deactivate cart
        -- UPDATE public.carts SET is_active = false WHERE id = v_cart_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id
    );
END;
$$;

-- 2. Ensure RLS allows the operation
-- Note: create_order_atomic is SECURITY DEFINER, so it runs as the owner (usually postgres)
-- But we should ensure permissions are granted.
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid) TO authenticated;

COMMIT;
