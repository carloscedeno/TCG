-- Migration: Fix Update Order Status Restock Logic
-- Date: 2026-05-18
-- Description: Updates public.update_order_status to correctly restock or deduct
--              inventory from both public.products and public.accessories.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_new_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_current_status TEXT;
    v_item RECORD;
BEGIN
    SELECT status INTO v_current_status FROM public.orders WHERE id = p_order_id;
    
    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Restock Logic: If moving TO cancelled/returned FROM active
    IF (p_new_status = 'cancelled' OR p_new_status = 'returned') AND (v_current_status <> 'cancelled' AND v_current_status <> 'returned') THEN
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
        
    -- Restoring Logic: If moving FROM cancelled/returned TO active
    ELSIF (v_current_status = 'cancelled' OR v_current_status = 'returned') AND (p_new_status <> 'cancelled' AND p_new_status <> 'returned') THEN
        FOR v_item IN SELECT product_id, accessory_id, quantity FROM public.order_items WHERE order_id = p_order_id
        LOOP
            IF v_item.product_id IS NOT NULL THEN
                UPDATE public.products 
                SET stock = stock - v_item.quantity 
                WHERE id = v_item.product_id;
            ELSIF v_item.accessory_id IS NOT NULL THEN
                UPDATE public.accessories 
                SET stock = stock - v_item.quantity 
                WHERE id = v_item.accessory_id;
            END IF;
        END LOOP;
    END IF;

    UPDATE public.orders 
    SET status = p_new_status
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

COMMIT;
