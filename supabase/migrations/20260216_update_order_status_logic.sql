-- Migration: Update Order Status Logic
-- Description: Updates status constraint, migrates data, updates creation RPC, and adds generic status update RPC
-- Date: 2026-02-16

-- 1. Drop old constraint first to allow updates
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Update existing data to match new schema
-- Map 'pending' to 'pending_payment'
UPDATE public.orders SET status = 'pending_payment' WHERE status = 'pending';
-- Map 'pending_verification' to 'on_hold'
UPDATE public.orders SET status = 'on_hold' WHERE status = 'pending_verification';
-- Map 'completed' to 'delivered'
UPDATE public.orders SET status = 'delivered' WHERE status = 'completed';

-- 3. Add new Status Constraint
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending_payment', 
    'paid', 
    'processing', 
    'ready_for_pickup', 
    'shipped', 
    'delivered', 
    'cancelled', 
    'returned', 
    'refunded', 
    'on_hold'
));

-- 4. Update create_order_atomic to use new default status
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
        'pending_payment', -- Updated default status
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
            product_name
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

-- 5. Create update_order_status RPC
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_old_status TEXT;
    v_item RECORD;
    v_current_stock INTEGER;
    v_new_status TEXT := p_new_status;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status FROM public.orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Validate new status
    IF v_new_status NOT IN ('pending_payment', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'on_hold') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid status: ' || v_new_status);
    END IF;

    -- No change needed
    IF v_old_status = v_new_status THEN
        RETURN jsonb_build_object('success', true);
    END IF;

    -- Logic for Inventory Updates
    
    -- Case A: RESTOCK (Moving TO Cancelled or Returned)
    IF v_new_status IN ('cancelled', 'returned') AND v_old_status NOT IN ('cancelled', 'returned') THEN
        FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
            UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    -- Case B: RE-DEDUCT (Moving FROM Cancelled or Returned TO Active status)
    IF v_old_status IN ('cancelled', 'returned') AND v_new_status IN ('pending_payment', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'on_hold') THEN
        FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
            
             SELECT stock INTO v_current_stock FROM public.products WHERE id = v_item.product_id FOR UPDATE;
             
             IF v_current_stock < v_item.quantity THEN
                RAISE EXCEPTION 'Insufficient stock to restore order for product ID: %', v_item.product_id;
             END IF;
             
             UPDATE public.products SET stock = stock - v_item.quantity WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    -- Update the status
    UPDATE public.orders SET status = v_new_status WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO authenticated;
