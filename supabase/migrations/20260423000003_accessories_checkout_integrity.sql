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
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);
CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
 RETURNS TABLE(cart_id uuid, cart_name text, is_pos boolean, items jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
    v_cart_name text;
    v_is_pos boolean;
    v_items jsonb;
BEGIN
    SELECT id, name, COALESCE(public.carts.is_pos, false)
    INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active, is_pos)
        VALUES (p_user_id, 'Carrito Principal', true, false)
        RETURNING id, name, false INTO v_cart_id, v_cart_name, v_is_pos;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ci.id,
            'product_id', ci.product_id,
            'accessory_id', ci.accessory_id,
            'printing_id', COALESCE(p.printing_id::text, ci.accessory_id::text),
            'quantity', ci.quantity,
            'price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0)
                          WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
                          THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
                          ELSE COALESCE(p.price, 0) END,
            'original_price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0) ELSE COALESCE(p.price, 0) END,
            'discount_percentage', CASE WHEN ci.accessory_id IS NOT NULL THEN 0 ELSE COALESCE(p.discount_percentage, 0) END,
            'name', COALESCE(p.name, a.name),
            'image_url', COALESCE(p.image_url, a.image_url),
            'set_code', COALESCE(p.set_code, a.category),
            'finish', COALESCE(p.finish, 'nonfoil'),
            'stock', COALESCE(p.stock, a.stock, 0),
            'type', CASE WHEN ci.accessory_id IS NOT NULL THEN 'accessory' ELSE 'product' END
        )
    )
    INTO v_items
    FROM public.cart_items ci
    LEFT JOIN public.products p ON ci.product_id = p.id
    LEFT JOIN public.accessories a ON ci.accessory_id = a.id
    WHERE ci.cart_id = v_cart_id;

    RETURN QUERY SELECT v_cart_id, v_cart_name, v_is_pos, COALESCE(v_items, '[]'::jsonb);
END;
$function$;

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

-- Ensure tracking works for everyone (Guests and Logged in)
GRANT SELECT ON public.orders TO anon, authenticated;
GRANT SELECT ON public.order_items TO anon, authenticated;

-- Public read access for orders (needed for tracking by ID)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can track orders by ID" ON public.orders;
CREATE POLICY "Public can track orders by ID" ON public.orders FOR SELECT USING (true);

-- Ensure order items are also readable
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" ON public.order_items FOR SELECT USING (true);

COMMIT;
