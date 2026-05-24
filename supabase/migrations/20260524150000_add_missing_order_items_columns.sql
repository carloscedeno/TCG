-- Migration to add missing columns to order_items that are expected by the frontend and the create_order_atomic RPC.
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS finish TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS printing_id UUID,
ADD COLUMN IF NOT EXISTS set_code TEXT;
