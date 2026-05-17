-- Migration: Product Offers and Discounts
-- Description: Adds discount functionality to products and historical tracking.

-- 1. Add discount columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_end_date timestamptz;

-- 2. Create product_offers_history for tracking
CREATE TABLE IF NOT EXISTS public.product_offers_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percentage numeric NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_offers_history ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE policyname = 'Admins can manage product offers' AND tablename = 'product_offers_history'
  ) THEN
    CREATE POLICY "Admins can manage product offers" ON public.product_offers_history
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid() AND pr.role = 'admin'
        )
      );
  END IF;
END
$$;

-- 3. Update get_inventory_list to include discount fields
DO $$ 
DECLARE
  func_record RECORD;
  drop_cmd TEXT;
BEGIN
  FOR func_record IN 
    SELECT oid::regprocedure AS func_signature 
    FROM pg_proc 
    WHERE proname = 'get_inventory_list' 
      AND pronamespace = 'public'::regnamespace
  LOOP
    drop_cmd := 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE;';
    EXECUTE drop_cmd;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_inventory_list(
    p_page integer, 
    p_page_size integer, 
    p_search text DEFAULT NULL::text, 
    p_game text DEFAULT NULL::text, 
    p_condition text DEFAULT NULL::text, 
    p_sort_by text DEFAULT 'name'::text, 
    p_sort_order text DEFAULT 'asc'::text, 
    p_only_new boolean DEFAULT false, 
    p_set_code text DEFAULT NULL::text
)
RETURNS TABLE(
    product_id uuid, 
    printing_id text, 
    name text, 
    game text, 
    set_code text, 
    condition text, 
    finish text, 
    price numeric, 
    stock integer, 
    image_url text, 
    rarity text, 
    updated_at timestamp with time zone, 
    total_count bigint,
    discount_percentage numeric,
    discount_end_date timestamptz
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    v_offset INTEGER := p_page * p_page_size;
    v_has_recent BOOLEAN;
    v_strixhaven_sets TEXT[] := ARRAY['sos', 'soa', 'soc', 'tsos'];
BEGIN
    IF p_only_new THEN
        SELECT EXISTS (
            SELECT 1 FROM public.products p
            WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
              AND (p_game IS NULL OR p.game = p_game)
              AND (p_condition IS NULL OR p.condition = p_condition)
              AND (p_set_code IS NULL OR p.set_code = p_set_code)
              AND LOWER(p.set_code) = ANY(v_strixhaven_sets)
        ) INTO v_has_recent;
    ELSE
        v_has_recent := FALSE;
    END IF;

    RETURN QUERY
    WITH filtered_inventory AS (
        SELECT 
            p.id as product_id,
            p.printing_id::text,
            p.name,
            p.game,
            p.set_code,
            p.condition,
            COALESCE(p.finish, 'nonfoil') as finish,
            p.price,
            p.stock,
            p.image_url,
            p.rarity,
            p.updated_at,
            p.discount_percentage,
            p.discount_end_date
        FROM public.products p
        WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
          AND (p_game IS NULL OR p.game = p_game)
          AND (p_condition IS NULL OR p.condition = p_condition)
          AND (p_set_code IS NULL OR p.set_code = p_set_code)
          AND (NOT p_only_new OR NOT v_has_recent OR LOWER(p.set_code) = ANY(v_strixhaven_sets))
    ),
    total_c AS (
        SELECT COUNT(*) as full_count FROM filtered_inventory
    )
    SELECT 
        fi.product_id, fi.printing_id, fi.name, fi.game, fi.set_code, 
        fi.condition, fi.finish, fi.price, fi.stock, fi.image_url, fi.rarity, 
        fi.updated_at, tc.full_count, fi.discount_percentage, fi.discount_end_date
    FROM filtered_inventory fi
    CROSS JOIN total_c tc
    ORDER BY 
        CASE WHEN p_sort_by = 'newest' THEN fi.updated_at END DESC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN fi.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN fi.name END DESC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN fi.price END ASC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN fi.price END DESC,
        CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' THEN fi.stock END ASC,
        CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' THEN fi.stock END DESC,
        fi.updated_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$;

-- 4. Update get_products_filtered to include discount fields and return discounted price if active
DO $$ 
DECLARE
  func_record RECORD;
  drop_cmd TEXT;
BEGIN
  FOR func_record IN 
    SELECT oid::regprocedure AS func_signature 
    FROM pg_proc 
    WHERE proname = 'get_products_filtered' 
      AND pronamespace = 'public'::regnamespace
  LOOP
    drop_cmd := 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE;';
    EXECUTE drop_cmd;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_products_filtered(
    search_query text DEFAULT NULL,
    game_filter text DEFAULT NULL,
    set_filter text[] DEFAULT NULL,
    rarity_filter text[] DEFAULT NULL,
    type_filter text[] DEFAULT NULL,
    color_filter text[] DEFAULT NULL,
    year_from integer DEFAULT NULL,
    year_to integer DEFAULT NULL,
    price_min numeric DEFAULT NULL,
    price_max numeric DEFAULT NULL,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    p_only_new boolean DEFAULT false,
    sort_by text DEFAULT 'newest'
)
RETURNS TABLE(
    id uuid,
    name text,
    game text,
    set_code text,
    price numeric,
    image_url text,
    rarity text,
    printing_id text,
    stock integer,
    set_name text,
    finish text,
    updated_at timestamptz,
    original_price numeric,
    discount_percentage numeric,
    discount_end_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_game_code TEXT;
  v_sort_by TEXT := COALESCE(sort_by, 'newest');
BEGIN
  IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN 
    v_game_code := 'MTG';
  ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' OR game_filter = 'POKEMON' THEN 
    v_game_code := 'PKM';
  ELSIF game_filter ILIKE 'One%' OR game_filter = 'OPC' OR game_filter = 'ONEPIECE' THEN 
    v_game_code := 'OPC';
  ELSIF game_filter ILIKE 'Digi%' OR game_filter = 'DGM' OR game_filter = 'DIGIMON' THEN 
    v_game_code := 'DGM';
  ELSE 
    v_game_code := game_filter;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.game,
    p.set_code,
    -- Calculate final price dynamically
    CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
         THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
         ELSE p.price 
    END as price,
    p.image_url,
    p.rarity,
    p.printing_id::text,
    p.stock,
    p.set_name,
    p.finish,
    p.updated_at,
    p.price as original_price,
    p.discount_percentage,
    p.discount_end_date
  FROM public.products p
  WHERE
    p.stock > 0
    AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.set_code ILIKE search_query)
    AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
    AND (set_filter IS NULL OR p.set_code = ANY(set_filter) OR p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter))
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    AND (price_min IS NULL OR p.price >= price_min)
    AND (price_max IS NULL OR p.price <= price_max)
    AND (NOT p_only_new OR (UPPER(p.set_code) IN ('SOS', 'SOA', 'SOC', 'TSOS')))
  ORDER BY
    CASE 
        WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
        WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
        ELSE 2 END ASC,
    CASE WHEN v_sort_by = 'newest' THEN p.updated_at END DESC,
    CASE WHEN v_sort_by = 'price_asc' THEN p.price END ASC,
    CASE WHEN v_sort_by = 'price_desc' THEN p.price END DESC,
    CASE WHEN v_sort_by = 'name' THEN p.name END ASC,
    CASE WHEN v_sort_by = 'name_desc' THEN p.name END DESC,
    CASE WHEN v_sort_by = 'release_date' THEN p.release_date END DESC,
    CASE WHEN v_sort_by = 'release_date_asc' THEN p.release_date END ASC,
    p.updated_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- 5. RPC to Manage Offers (Create/Update)
CREATE OR REPLACE FUNCTION public.manage_product_offer(
  p_product_id uuid,
  p_discount_percentage numeric,
  p_end_date timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate user is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- End previous active offers in history for this product
  UPDATE public.product_offers_history
  SET is_active = false
  WHERE product_id = p_product_id AND is_active = true;

  IF p_discount_percentage > 0 THEN
    -- Insert new history record
    INSERT INTO public.product_offers_history (product_id, discount_percentage, end_date, is_active, created_by)
    VALUES (p_product_id, p_discount_percentage, p_end_date, true, auth.uid());
    
    -- Update product
    UPDATE public.products
    SET discount_percentage = p_discount_percentage,
        discount_end_date = p_end_date
    WHERE id = p_product_id;
  ELSE
    -- Clear offer
    UPDATE public.products
    SET discount_percentage = 0,
        discount_end_date = NULL
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- 6. Update get_user_cart for discounts and accessories
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);
CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
 RETURNS TABLE(cart_id uuid, cart_name text, is_pos boolean, items jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
    v_cart_name text;
    v_is_pos boolean;
    v_items jsonb;
BEGIN
    SELECT id, name, COALESCE(public.carts.is_pos, false)
    INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active, is_pos)
        VALUES (p_user_id, 'Carrito Principal', true, false)
        RETURNING id, name, false INTO v_cart_id, v_cart_name, v_is_pos;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ci.id,
            'product_id', ci.product_id,
            'accessory_id', ci.accessory_id,
            'printing_id', COALESCE(p.printing_id::text, ci.accessory_id::text),
            'quantity', ci.quantity,
            'price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0)
                          WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
                          THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
                          ELSE COALESCE(p.price, 0) END,
            'original_price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0) ELSE COALESCE(p.price, 0) END,
            'discount_percentage', CASE WHEN ci.accessory_id IS NOT NULL THEN 0 ELSE COALESCE(p.discount_percentage, 0) END,
            'name', COALESCE(p.name, a.name),
            'image_url', COALESCE(p.image_url, a.image_url),
            'set_code', COALESCE(p.set_code, a.category),
            'finish', COALESCE(p.finish, 'nonfoil'),
            'stock', COALESCE(p.stock, a.stock, 0),
            'type', CASE WHEN ci.accessory_id IS NOT NULL THEN 'accessory' ELSE 'product' END
        )
    )
    INTO v_items
    FROM public.cart_items ci
    LEFT JOIN public.products p ON ci.product_id = p.id
    LEFT JOIN public.accessories a ON ci.accessory_id = a.id
    WHERE ci.cart_id = v_cart_id;

    RETURN QUERY SELECT v_cart_id, v_cart_name, v_is_pos, COALESCE(v_items, '[]'::jsonb);
END;
$function$;
