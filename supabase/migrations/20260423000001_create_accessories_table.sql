-- Migration: Create accessories table and integrate with cart/orders
-- Date: 2026-04-23
-- Description: Adds accessories support without disrupting existing products logic.

BEGIN;

-- 1. Create Accessories Table
CREATE TABLE IF NOT EXISTS public.accessories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL CHECK (price >= 0),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url text,
    category text NOT NULL, -- 'Sealed Product', 'Sleeves', 'Deck Boxes', 'Playmats', etc.
    game_id integer REFERENCES public.games(game_id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create Accessories History Table (Audit Log)
CREATE TABLE IF NOT EXISTS public.accessories_history (
    history_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    accessory_id uuid REFERENCES public.accessories(id) ON DELETE CASCADE,
    changed_by uuid, -- Could link to auth.users(id) if needed
    change_type text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data jsonb,
    new_data jsonb,
    changed_at timestamptz DEFAULT now()
);

-- 3. Trigger for Change Log
CREATE OR REPLACE FUNCTION public.log_accessory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.accessories_history (accessory_id, change_type, new_data)
        VALUES (NEW.id, 'INSERT', to_jsonb(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.accessories_history (accessory_id, change_type, old_data, new_data)
        VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.accessories_history (accessory_id, change_type, old_data)
        VALUES (OLD.id, 'DELETE', to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_log_accessory_change
AFTER INSERT OR UPDATE OR DELETE ON public.accessories
FOR EACH ROW EXECUTE FUNCTION public.log_accessory_change();

-- 4. Update Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_accessories_updated_at
BEFORE UPDATE ON public.accessories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Integrate with Cart Items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS accessory_id uuid REFERENCES public.accessories(id),
ALTER COLUMN product_id DROP NOT NULL;

-- Ensure only one of product_id or accessory_id is set
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_check_item_type') THEN
        ALTER TABLE public.cart_items 
        ADD CONSTRAINT cart_items_check_item_type 
        CHECK ((product_id IS NOT NULL AND accessory_id IS NULL) OR (product_id IS NULL AND accessory_id IS NOT NULL));
    END IF;
END $$;

-- 6. Integrate with Order Items
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS accessory_id uuid REFERENCES public.accessories(id),
ALTER COLUMN product_id DROP NOT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_check_item_type') THEN
        ALTER TABLE public.order_items 
        ADD CONSTRAINT order_items_check_item_type 
        CHECK ((product_id IS NOT NULL AND accessory_id IS NULL) OR (product_id IS NULL AND accessory_id IS NOT NULL));
    END IF;
END $$;

-- 7. Add Accessory to Cart RPC
CREATE OR REPLACE FUNCTION public.add_accessory_to_cart_v1(
    p_accessory_id uuid,
    p_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
    v_existing_id uuid;
BEGIN
    -- 1. Get active cart
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
    
    IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active)
        VALUES (auth.uid(), 'Carrito Principal', true)
        RETURNING id INTO v_cart_id;
    END IF;

    -- 2. Check if already exists
    SELECT id INTO v_existing_id FROM public.cart_items 
    WHERE cart_id = v_cart_id AND accessory_id = p_accessory_id;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.cart_items SET quantity = quantity + p_quantity WHERE id = v_existing_id;
    ELSE
        INSERT INTO public.cart_items (cart_id, accessory_id, quantity)
        VALUES (v_cart_id, p_accessory_id, p_quantity);
    END IF;

    RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id);
END;
$$;

-- 8. Updated get_user_cart to include accessories
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
    SELECT id, name, is_pos INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'id', null, 'name', 'Carrito Principal', 'is_pos', false);
    END IF;

    SELECT jsonb_agg(item_row) INTO v_items
    FROM (
        SELECT 
            ci.id as cart_item_id,
            ci.product_id,
            ci.accessory_id,
            ci.quantity,
            COALESCE(p.printing_id, ci.accessory_id) as printing_id,
            COALESCE(p.name, acc.name) as name,
            COALESCE(p.price_usd, acc.price, 0) as price,
            COALESCE(p.image_url, acc.image_url) as image_url,
            COALESCE(p.set_code, acc.category) as set_code,
            COALESCE(p.stock, acc.stock, 0) as stock,
            COALESCE(p.finish, 'nonfoil') as finish,
            CASE WHEN ci.accessory_id IS NOT NULL THEN 'accessory' ELSE 'product' END as type
        FROM public.cart_items ci
        LEFT JOIN public.products p ON ci.product_id = p.id
        LEFT JOIN public.accessories acc ON ci.accessory_id = acc.id
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

-- 9. Get Accessories Filtered RPC
CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id integer DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    price numeric,
    stock integer,
    image_url text,
    category text,
    game_id integer,
    created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.name, a.description, a.price, a.stock, a.image_url, a.category, a.game_id, a.created_at
    FROM public.accessories a
    WHERE a.is_active = true
      AND (p_game_id IS NULL OR a.game_id = p_game_id)
      AND (p_category IS NULL OR a.category = p_category)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 10. RLS Policies
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for accessories" ON public.accessories;
CREATE POLICY "Public read access for accessories" ON public.accessories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for accessories" ON public.accessories;
CREATE POLICY "Admin full access for accessories" ON public.accessories TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for accessories_history" ON public.accessories_history;
CREATE POLICY "Admin full access for accessories_history" ON public.accessories_history TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_accessory_to_cart_v1(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessories_filtered(integer, text, integer, integer) TO authenticated;
GRANT SELECT ON public.accessories TO anon;
GRANT SELECT ON public.accessories TO authenticated;
GRANT ALL ON public.accessories_history TO authenticated;

COMMIT;
