-- Migration: Supplemental Supabase Security Fixes (Phase 2)
-- Enable RLS on remaining public tables and enforce security_invoker on views
-- Date: 2026-03-10

BEGIN;

-- 1. Enforce security_invoker on products_with_prices view
-- This explicitly addresses the linter error security_definer_view
DROP VIEW IF EXISTS public.products_with_prices;

CREATE OR REPLACE VIEW public.products_with_prices 
WITH (security_invoker = true)
AS
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

-- 2. Enable RLS on remaining public tables
DO $$
DECLARE
    t text;
    tables_to_enable text[] := ARRAY[
        'cards', 'sets', 'card_printings', 'price_sources', 
        'card_legalities', 'card_attributes', 'card_images', 
        'aggregated_prices', 'card_types', 'conditions', 
        'external_identifiers', 'sources', 'games',
        'user_watchlist', 'user_collections', 'user_addresses',
        'price_history'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_enable LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- 3. Define Public Read Policies for Metadata Tables
-- These tables are read-only for the public, only admins/sync scripts use service_role
DO $$
DECLARE
    t text;
    metadata_tables text[] := ARRAY[
        'cards', 'sets', 'card_printings', 'price_sources', 
        'card_legalities', 'card_attributes', 'card_images', 
        'aggregated_prices', 'card_types', 'conditions', 
        'external_identifiers', 'sources', 'games'
    ];
BEGIN
    FOREACH t IN ARRAY metadata_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('DROP POLICY IF EXISTS "Public read access" ON public.%I', t);
            EXECUTE format('CREATE POLICY "Public read access" ON public.%I FOR SELECT USING (true)', t);
        END IF;
    END LOOP;
END $$;

-- 4. Define Owner-Only Policies for User Tables
-- user_watchlist
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_watchlist') THEN
        DROP POLICY IF EXISTS "Users can manage their own watchlist" ON public.user_watchlist;
        CREATE POLICY "Users can manage their own watchlist" ON public.user_watchlist FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- user_collections
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_collections') THEN
        DROP POLICY IF EXISTS "Users can manage their own collections" ON public.user_collections;
        CREATE POLICY "Users can manage their own collections" ON public.user_collections FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- user_addresses
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_addresses') THEN
        DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.user_addresses;
        CREATE POLICY "Users can manage their own addresses" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Define Policy for price_history (Public Read)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'price_history') THEN
        DROP POLICY IF EXISTS "Public can view price history" ON public.price_history;
        CREATE POLICY "Public can view price history" ON public.price_history FOR SELECT USING (true);
    END IF;
END $$;

COMMIT;
