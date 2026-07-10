BEGIN;

-- 1. Fix delete_order_item_v1 (change unit_price to price_at_purchase)
CREATE OR REPLACE FUNCTION public.delete_order_item_v1(p_order_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_item RECORD;
    v_order RECORD;
    v_new_total NUMERIC;
    v_deduction NUMERIC;
BEGIN
    -- Get the item
    SELECT * INTO v_order_item FROM public.order_items WHERE id = p_order_item_id;
    IF v_order_item IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order item not found');
    END IF;

    -- Get the order
    SELECT * INTO v_order FROM public.orders WHERE id = v_order_item.order_id;
    IF v_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Calculate deduction (using price_at_purchase)
    v_deduction := COALESCE(v_order_item.quantity * v_order_item.price_at_purchase, 0);

    -- Restock if order is not cancelled, returned, or deleted
    IF v_order.status NOT IN ('cancelled', 'returned', 'deleted') THEN
        IF v_order_item.product_id IS NOT NULL THEN
            UPDATE public.products 
            SET stock = stock + v_order_item.quantity 
            WHERE id = v_order_item.product_id;
        ELSIF v_order_item.accessory_id IS NOT NULL THEN
            UPDATE public.accessories 
            SET stock = stock + v_order_item.quantity 
            WHERE id = v_order_item.accessory_id;
        END IF;
    END IF;

    -- Delete the order item
    DELETE FROM public.order_items WHERE id = p_order_item_id;

    -- Update order total
    UPDATE public.orders 
    SET total_amount = GREATEST(0, total_amount - v_deduction)
    WHERE id = v_order.id
    RETURNING total_amount INTO v_new_total;

    RETURN jsonb_build_object('success', true, 'new_total', v_new_total);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 2. Create soft_delete_order
CREATE OR REPLACE FUNCTION public.soft_delete_order(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF v_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- If the order is already deleted, do nothing
    IF v_order.status = 'deleted' THEN
        RETURN jsonb_build_object('success', true);
    END IF;

    -- Restock if order is not cancelled or returned (meaning it was active and stock was deducted)
    IF v_order.status NOT IN ('cancelled', 'returned') THEN
        FOR v_item IN SELECT product_id, accessory_id, quantity FROM public.order_items WHERE order_id = p_order_id
        LOOP
            IF v_item.product_id IS NOT NULL THEN
                UPDATE public.products 
                SET stock = stock + v_item.quantity 
                WHERE id = v_item.product_id;
            ELSIF v_item.accessory_id IS NOT NULL THEN
                UPDATE public.accessories 
                SET stock = stock + v_item.quantity 
                WHERE id = v_item.accessory_id;
            END IF;
        END LOOP;
    END IF;

    -- Set status to deleted
    UPDATE public.orders SET status = 'deleted' WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.delete_order_item_v1(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_order(uuid) TO authenticated;

COMMIT;
