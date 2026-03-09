-- Migration: Add Soft Delete and Full CRUD to Orders
-- Description: Adds deleted_at column, soft delete RPC, and update order details RPC
-- Date: 2026-02-16

-- 1. Add deleted_at column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Soft Delete RPC
CREATE OR REPLACE FUNCTION public.soft_delete_order(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM public.orders WHERE id = p_order_id;
    
    -- Optional: If deleting a PAID/ACTIVE order, maybe verify/warn?
    -- For now, just mark deleted.
    -- We assume inventory was handled by status change (e.g., Cancelled first).
    -- Or, if deleting implicitly cancels? 
    -- Usually better to explicitly cancel first.
    
    UPDATE public.orders 
    SET deleted_at = NOW(),
        updated_at = NOW() -- Assume updated_at exists or trigger handles it
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. Update Order Details RPC (Full CRUD - Edit)
CREATE OR REPLACE FUNCTION public.update_order_details(
    p_order_id UUID,
    p_shipping_address JSONB,
    p_guest_info JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.orders 
    SET shipping_address = p_shipping_address,
        guest_info = p_guest_info,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.soft_delete_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_details(UUID, JSONB, JSONB) TO authenticated;

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at) WHERE deleted_at IS NULL;
