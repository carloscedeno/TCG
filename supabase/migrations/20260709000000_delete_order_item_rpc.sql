-- Migration: Delete Order Item RPC
-- Date: 2026-07-09
-- Description: Creates public.delete_order_item_v1 to safely delete an item from an order and restock inventory

BEGIN;

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

    -- Calculate deduction
    v_deduction := COALESCE(v_order_item.quantity * v_order_item.unit_price, 0);

    -- Restock if order is not cancelled or returned
    IF v_order.status <> 'cancelled' AND v_order.status <> 'returned' THEN
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

GRANT EXECUTE ON FUNCTION public.delete_order_item_v1(uuid) TO authenticated;

COMMIT;
