-- =============================================================================
-- Migration: 20260421000003_mvp_ui_infalible.sql
-- Goal: Phase 1 Architecture Finalization (Accessories + Banners + Security)
-- =============================================================================

BEGIN;

-- 1. STORAGE ASSETS (Bucket for banners and products)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- We assume public read, and admin-only write. 
-- Role 'admin' is checked from public.profiles.
DO $$ 
BEGIN
    -- Cleanup potential existing policies to ensure clean state
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'public_assets');

    DROP POLICY IF EXISTS "Admin All Access" ON storage.objects;
    CREATE POLICY "Admin All Access" ON storage.objects FOR ALL 
    USING (bucket_id = 'public_assets' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
END $$;

-- 2. HERO BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    category TEXT DEFAULT 'main_hero',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Banners" ON public.hero_banners;
    CREATE POLICY "Public Read Banners" ON public.hero_banners FOR SELECT USING (is_active = true);

    DROP POLICY IF EXISTS "Admin Full Access Banners" ON public.hero_banners;
    CREATE POLICY "Admin Full Access Banners" ON public.hero_banners FOR ALL 
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
END $$;

-- 3. CART INTEGRITY & CONSTRAINTS
-- Ensure unique items in cart for ON CONFLICT support
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cart_product_key') THEN
        ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_cart_product_key UNIQUE (cart_id, product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cart_accessory_key') THEN
        ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_cart_accessory_key UNIQUE (cart_id, accessory_id);
    END IF;
END $$;

-- 4. UPDATED CART RPC (LEFT JOIN / COALESCE Support for Accessories)
CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
    v_cart_name text;
    v_is_pos boolean;
    v_items jsonb;
BEGIN
    -- Identify the active cart for the user
    SELECT id, name, is_pos INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;

    -- Fallback: pick newest
    IF v_cart_id IS NULL THEN
        SELECT id, name, is_pos INTO v_cart_id, v_cart_name, v_is_pos
        FROM public.carts 
        WHERE user_id = auth.uid()
        ORDER BY updated_at DESC
        LIMIT 1;
        
        IF v_cart_id IS NULL THEN
            RETURN jsonb_build_object('items', '[]'::jsonb, 'id', null, 'name', 'Carrito Principal', 'is_pos', false);
        END IF;
        UPDATE public.carts SET is_active = true WHERE id = v_cart_id;
    END IF;

    -- Aggregate items
    SELECT jsonb_agg(item_row) INTO v_items
    FROM (
        SELECT 
            ci.id as cart_item_id,
            ci.product_id,
            ci.accessory_id,
            ci.quantity,
            COALESCE(p.name, a.name) as name,
            COALESCE(p.price, a.price, 0) as price,
            COALESCE(p.image_url, a.image_url) as image_url,
            p.set_code,
            COALESCE(p.stock, a.stock, 0) as stock,
            p.finish,
            CASE WHEN ci.accessory_id IS NOT NULL THEN 'accessory' ELSE 'product' END as type
        FROM public.cart_items ci
        LEFT JOIN public.products p ON ci.product_id = p.id
        LEFT JOIN public.accessories a ON ci.accessory_id = a.id
        WHERE ci.cart_id = v_cart_id
    ) item_row;

    RETURN jsonb_build_object(
        'id', v_cart_id,
        'name', v_cart_name,
        'is_pos', v_is_pos,
        'items', COALESCE(v_items, '[]'::jsonb)
    );
END;
$$;

-- 5. NEW ACCESSORY CART RPC (UPSERT logic to prevent duplicates #9)
CREATE OR REPLACE FUNCTION public.add_accessory_to_cart_v1(
    p_accessory_id uuid,
    p_quantity integer DEFAULT 1,
    p_cart_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
    v_item_id uuid;
BEGIN
    -- Get or create active cart
    IF p_cart_id IS NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
        IF v_cart_id IS NULL THEN
            INSERT INTO public.carts (user_id, name, is_active) 
            VALUES (auth.uid(), 'Carrito Principal', true) 
            RETURNING id INTO v_cart_id;
        END IF;
    ELSE
        v_cart_id := p_cart_id;
    END IF;

    -- UPSERT: Add to quantity if already exists
    INSERT INTO public.cart_items (cart_id, accessory_id, quantity)
    VALUES (v_cart_id, p_accessory_id, p_quantity)
    ON CONFLICT (cart_id, accessory_id) 
    DO UPDATE SET quantity = public.cart_items.quantity + EXCLUDED.quantity
    RETURNING id INTO v_item_id;

    RETURN v_item_id;
END;
$$;

-- 6. ORDER SYSTEM HARDENING (Bug #3, #8, #6)
-- Update order_items structure for poly-categorization
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS accessory_id UUID REFERENCES public.accessories(id);

-- Refined create_order_atomic with Price Verification and Stock Management
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_total_amount numeric,
    p_items jsonb, -- Array of items: [{id, type, quantity, price}]
    p_shipping_address jsonb DEFAULT NULL,
    p_guest_info jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_current_price numeric;
BEGIN
    -- 1. Create the order header
    INSERT INTO public.orders (user_id, total_amount, shipping_address, guest_info)
    VALUES (p_user_id, p_total_amount, p_shipping_address, p_guest_info)
    RETURNING id INTO v_order_id;

    -- 2. Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        IF (v_item->>'type') = 'product' THEN
            -- Verify price from products table
            SELECT price INTO v_current_price FROM public.products WHERE id = (v_item->>'id')::uuid;
            IF v_current_price IS NULL OR v_current_price != (v_item->>'price')::numeric THEN
                RAISE EXCEPTION 'Security check failed: Price mismatch for product %. Expected %, got %', 
                    v_item->>'id', v_current_price, v_item->>'price';
            END IF;

            INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES (v_order_id, (v_item->>'id')::uuid, (v_item->>'quantity')::int, (v_item->>'price')::numeric);

            -- Stock deduction
            UPDATE public.products 
            SET stock = stock - (v_item->>'quantity')::int
            WHERE id = (v_item->>'id')::uuid;

        ELSIF (v_item->>'type') = 'accessory' THEN
            -- Verify price from accessories table
            SELECT price INTO v_current_price FROM public.accessories WHERE id = (v_item->>'id')::uuid;
            IF v_current_price IS NULL OR v_current_price != (v_item->>'price')::numeric THEN
                RAISE EXCEPTION 'Security check failed: Price mismatch for accessory %. Expected %, got %', 
                    v_item->>'id', v_current_price, v_item->>'price';
            END IF;

            INSERT INTO public.order_items (order_id, accessory_id, quantity, price_at_purchase)
            VALUES (v_order_id, (v_item->>'id')::uuid, (v_item->>'quantity')::int, (v_item->>'price')::numeric);

            -- Stock deduction
            UPDATE public.accessories
            SET stock = stock - (v_item->>'quantity')::int
            WHERE id = (v_item->>'id')::uuid;
        END IF;
    END LOOP;

    RETURN v_order_id;
END;
$$;

-- 7. METADATA & INDICES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_hero_banners_ordering ON public.hero_banners(display_order);
CREATE INDEX IF NOT EXISTS idx_order_items_accessory ON public.order_items(accessory_id) WHERE accessory_id IS NOT NULL;

COMMIT;
