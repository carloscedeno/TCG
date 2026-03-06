-- Migration: Resolve RLS and Schema issues for Guest Checkout
-- Date: 2026-03-06

-- 1. Ensure product_name column exists in order_items
-- This was missing from original table but used in create_order_atomic
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- 2. Ensure RLS is disabled for orders and order_items to allow public tracking
-- (This is redundant if already run, but ensures state)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 3. Grant explicit permissions to anon and authenticated roles
-- Sometimes just disabling RLS is not enough if the grant is missing
GRANT SELECT ON public.orders TO anon, authenticated;
GRANT SELECT ON public.order_items TO anon, authenticated;
GRANT UPDATE ON public.orders TO anon, authenticated; -- For uploading payment proof

-- 4. Ensure payment-proofs bucket is public
-- (Can only do if we have storage policies, but usually storage is separate)
-- We'll assume storage bucket permissions are handled in dashboard or standard policy
