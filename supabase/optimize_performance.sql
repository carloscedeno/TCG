-- PERFORMANCE OPTIMIZATION: Storefront & Accessories
-- Date: 2026-04-28

BEGIN;

-- 1. OPTIMIZE get_products_filtered
-- Update configuration for better performance (STABLE + search_path)
ALTER FUNCTION public.get_products_filtered(text,text,text[],text[],text[],text[],integer,integer,numeric,numeric,integer,integer,boolean,text) 
STABLE
SET search_path = public;

-- 2. NEW INDEXES FOR products
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products USING btree (price);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products USING btree (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_game_stock ON public.products USING btree (game, stock) WHERE (stock > 0);

-- 3. OPTIMIZE get_accessories_filtered (already has search_path but ensure it is STABLE)
ALTER FUNCTION public.get_accessories_filtered(integer,text,text,text,text,numeric,numeric,text,integer,integer) 
STABLE;

-- 4. CONDITIONAL INDEXES FOR accessories (Only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accessories') THEN
        CREATE INDEX IF NOT EXISTS idx_accessories_is_active ON public.accessories USING btree (is_active) WHERE (is_active = true);
        CREATE INDEX IF NOT EXISTS idx_accessories_game_id ON public.accessories USING btree (game_id);
        CREATE INDEX IF NOT EXISTS idx_accessories_category_code ON public.accessories USING btree (category_code);
        CREATE INDEX IF NOT EXISTS idx_accessories_name_trgm ON public.accessories USING gin (name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_accessories_price ON public.accessories USING btree (price);
        CREATE INDEX IF NOT EXISTS idx_accessories_created_at ON public.accessories USING btree (created_at DESC);
    END IF;
END $$;

COMMIT;
