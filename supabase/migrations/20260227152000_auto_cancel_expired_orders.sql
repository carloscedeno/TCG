-- Migration: Add function to cancel expired orders
-- Date: 2026-02-27

CREATE OR REPLACE FUNCTION public.cancel_expired_orders(p_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_order RECORD;
    v_cancelled_count INTEGER := 0;
BEGIN
    -- Find all orders that are pending_payment for more than p_hours
    FOR v_order IN 
        SELECT id 
        FROM public.orders 
        WHERE status = 'pending_payment' 
        AND created_at < NOW() - (p_hours || ' hours')::INTERVAL
    LOOP
        -- Re-use the existing update_order_status function to handle stock returning
        PERFORM public.update_order_status(v_order.id, 'cancelled');
        v_cancelled_count := v_cancelled_count + 1;
    END LOOP;

    RETURN v_cancelled_count;
END;
$function$;
