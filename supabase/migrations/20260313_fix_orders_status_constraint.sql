-- Migration: fix_orders_status_constraint
-- Description: Ensures the orders_status_check constraint includes 'pending_verification'

-- 1. Drop the existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add the comprehensive constraint
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
    'pending_verification',
    'awaiting_payment',
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

-- 3. Ensure the RPC uses the correct status (it already does, but we re-assert success here)
-- No changes needed to create_order_atomic as it already uses 'pending_verification'.
