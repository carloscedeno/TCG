-- Migration: Allow On-Demand Orders and Fix Stock Validation
-- Date: 2026-05-07
-- Description: Updates create_order_atomic to support is_on_demand flag and avoid blocking orders with low stock.

BEGIN;

-- 1. Add is_on_demand column to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_on_demand BOOLEAN DEFAULT false;

-- 2. Enhanced create_order_atomic
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_items jsonb, -- Array of {product_id?: uuid, accessory_id?: uuid, quantity: int, price: numeric, is_on_demand?: boolean}
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
        -- Safe extraction of IDs
        v_target_id := NULLIF(v_item->>'product_id', 'null')::uuid;
        v_acc_id := NULLIF(v_item->>'accessory_id', 'null')::uuid;
        v_is_on_demand := COALESCE((v_item->>'is_on_demand')::boolean, false);
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

        -- C. Execute Insertion & Stock Decrement (allowing On-Demand)
        IF v_target_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            -- Auto-detect on demand if not explicitly sent but stock is low
            IF NOT v_is_on_demand AND v_current_stock < (v_item->>'quantity')::integer THEN
                v_is_on_demand := true;
            END IF;

            INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase, is_on_demand)
            VALUES (v_order_id, v_target_id, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric), v_is_on_demand);

            -- Update stock (floor at 0, or could allow negative if business prefers)
            UPDATE public.products SET stock = GREATEST(0, stock - (v_item->>'quantity')::integer) WHERE id = v_target_id;

        ELSIF v_acc_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            -- Auto-detect on demand for accessories too
            IF NOT v_is_on_demand AND v_current_stock < (v_item->>'quantity')::integer THEN
                v_is_on_demand := true;
            END IF;

            INSERT INTO public.order_items (order_id, accessory_id, quantity, price_at_purchase, is_on_demand)
            VALUES (v_order_id, v_acc_id, (v_item->>'quantity')::integer, COALESCE(v_real_price, (v_item->>'price')::numeric), v_is_on_demand);

            UPDATE public.accessories SET stock = GREATEST(0, stock - (v_item->>'quantity')::integer) WHERE id = v_acc_id;
        
        ELSE
            RAISE EXCEPTION 'Item de orden inválido o no encontrado: %', (v_item->>'name');
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

COMMIT;
