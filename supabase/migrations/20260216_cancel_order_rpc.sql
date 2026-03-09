-- Migration: Create cancel_order_and_restock RPC
-- Description: Cancels an order and automatically restocks the items based on order_items history
-- Date: 2026-02-16

CREATE OR REPLACE FUNCTION public.cancel_order_and_restock(
    p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_order_status text;
    v_item record;
BEGIN
    -- Check order status
    SELECT status INTO v_order_status
    FROM public.orders
    WHERE id = p_order_id;

    IF v_order_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_order_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order already cancelled');
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = 'cancelled'
    WHERE id = p_order_id;

    -- Restock items
    FOR v_item IN
        SELECT product_id, quantity
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        UPDATE public.products
        SET stock = stock + v_item.quantity
        WHERE id = v_item.product_id;
    END LOOP;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.cancel_order_and_restock(uuid) TO authenticated;
