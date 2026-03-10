-- Migration: Supabase Security Audit Fixes
-- Enable Row Level Security (RLS) and fix Security Definer views
-- Date: 2026-03-10

BEGIN;

-- 1. Enable RLS on target tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY; -- Also reported by linter usually

-- 2. Define Policies for Products
-- Publicly readable, Admin modifiable
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 3. Define Policies for Carts
-- Users can only manage their own cart
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.carts;
CREATE POLICY "Users can manage their own carts" ON public.carts
    FOR ALL USING (auth.uid() = user_id);

-- 4. Define Policies for Cart Items
-- Users can only manage items in their own cart
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

-- 5. Define Policies for Orders
-- Users can view/update their own orders. Admins can do everything.
-- Allows 'anon' role to select/update for guest tracking/payment proof as per 20260306_resolve_rls_and_schema.sql
DROP POLICY IF EXISTS "Users/Anons can view their own orders" ON public.orders;
CREATE POLICY "Users/Anons can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users/Anons can update their own orders" ON public.orders;
CREATE POLICY "Users/Anons can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. Define Policies for Order Items
-- Inherit visibility from the parent order
DROP POLICY IF EXISTS "Users/Anons can view their own order items" ON public.order_items;
CREATE POLICY "Users/Anons can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR auth.role() = 'anon')
        )
    );

DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 7. Define Policies for Price Alerts (if the table exists in public)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'price_alerts') THEN
        ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can manage their own price alerts" ON public.price_alerts;
        EXECUTE 'CREATE POLICY "Users can manage their own price alerts" ON public.price_alerts FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;

-- 8. Fix View: products_with_prices
-- Recreate without SECURITY DEFINER (default is INVOKER)
-- We use a view that joins products and card_printings to provide the effective_price
DROP VIEW IF EXISTS public.products_with_prices;

CREATE OR REPLACE VIEW public.products_with_prices AS
SELECT 
    p.id,
    p.printing_id,
    p.name,
    p.condition,
    p.stock,
    p.image_url,
    p.set_code,
    p.game,
    p.created_at,
    p.updated_at,
    COALESCE(cp.avg_market_price_usd, p.price, 0) as effective_price
FROM public.products p
LEFT JOIN public.card_printings cp ON p.printing_id = cp.printing_id;

-- 9. Explicit Grants
GRANT SELECT ON public.products_with_prices TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

COMMIT;
