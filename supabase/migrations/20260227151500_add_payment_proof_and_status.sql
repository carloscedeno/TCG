-- Migration: Add payment_proof_url and payment_uploaded status
-- Date: 2026-02-27

-- 1. Add payment_proof_url column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- 2. Drop old status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 3. Add new Status Constraint including 'payment_uploaded'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending_payment',
    'payment_uploaded',
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

-- 4. Update the update_order_status function to include the new valid status
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
    IF v_new_status NOT IN ('pending_payment', 'payment_uploaded', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded', 'on_hold') THEN
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
    IF v_old_status IN ('cancelled', 'returned') AND v_new_status IN ('pending_payment', 'payment_uploaded', 'paid', 'processing', 'ready_for_pickup', 'shipped', 'delivered', 'on_hold') THEN
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
