-- Migration: Enhance create_order_atomic and implement Accessory Inventory Integrity
-- Date: 2026-04-23
-- Description: Supports accessories in orders and auto-decrements stock.

BEGIN;

-- 1. CLEANUP: Drop existing overloads to avoid PGRST202 errors
-- We drop all known variations to ensure a clean state
DROP FUNCTION IF EXISTS public.create_order_atomic(uuid, jsonb, jsonb, numeric);
DROP FUNCTION IF EXISTS public.create_order_atomic(uuid, jsonb, jsonb, numeric, uuid);
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, numeric, uuid);
DROP FUNCTION IF EXISTS public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb);
DROP FUNCTION IF EXISTS public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb, uuid);

-- 2. Enhanced create_order_atomic to support accessories
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_items jsonb, -- Array of {product_id?: uuid, accessory_id?: uuid, quantity: int, price: numeric}
    p_shipping_address jsonb,
    p_total_amount numeric,
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
        -- A. Handle Cards (Products)
        IF (v_item->>'product_id') IS NOT NULL THEN
            -- Validate stock and get real price
            SELECT stock, price INTO v_current_stock, v_real_price 
            FROM public.products 
            WHERE id = (v_item->>'product_id')::uuid;

            IF v_current_stock < (v_item->>'quantity')::integer THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto %', (v_item->>'product_id');
            END IF;

            -- Insert order item
            INSERT INTO public.order_items (order_id, product_id, quantity, price)
            VALUES (v_order_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric));

            -- Update stock
            UPDATE public.products 
            SET stock = stock - (v_item->>'quantity')::integer 
            WHERE id = (v_item->>'product_id')::uuid;

        -- B. Handle Accessories
        ELSIF (v_item->>'accessory_id') IS NOT NULL THEN
            -- Validate stock and get real price
            SELECT stock, price INTO v_current_stock, v_real_price 
            FROM public.accessories 
            WHERE id = (v_item->>'accessory_id')::uuid;

            IF v_current_stock IS NULL THEN
                RAISE EXCEPTION 'Accesorio no encontrado: %', (v_item->>'accessory_id');
            END IF;

            IF v_current_stock < (v_item->>'quantity')::integer THEN
                RAISE EXCEPTION 'Stock insuficiente para el accesorio %', (v_item->>'name');
            END IF;

            -- Insert order item
            INSERT INTO public.order_items (order_id, accessory_id, quantity, price)
            VALUES (v_order_id, (v_item->>'accessory_id')::uuid, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric));

            -- Update stock
            UPDATE public.accessories 
            SET stock = stock - (v_item->>'quantity')::integer 
            WHERE id = (v_item->>'accessory_id')::uuid;
        
        ELSE
            RAISE EXCEPTION 'Item de orden inválido: debe tener product_id o accessory_id';
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
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, uuid) TO anon;

COMMIT;
