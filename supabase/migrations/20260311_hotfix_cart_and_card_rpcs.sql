-- ============================================================
-- HOTFIX: Fix critical production errors
-- Date: 2026-03-11
--
-- Error 1: column ci.created_at does not exist (get_user_cart)
--   The cart_items table has no created_at column.
--   Fix: Remove ORDER BY ci.created_at, use ci.id DESC instead.
--
-- Error 2: column mv.avg_market_price_foil_usd does not exist
--   The materialized view mv_unique_cards was redefined in
--   20260310_simplify_pricing_to_ck_nm.sql without that column,
--   but 20260310_add_foil_prices.sql (executed afterward due to
--   alphabetical ordering) re-created get_unique_cards_optimized
--   referencing the now-missing column.
--   Fix: Recreate get_unique_cards_optimized without the foil column.
-- ============================================================

-- ============================================================
-- FIX 1: get_user_cart — remove ORDER BY ci.created_at
-- ============================================================
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);
CREATE OR REPLACE FUNCTION public.get_user_cart(
    p_user_id uuid
)
RETURNS TABLE (
    cart_item_id uuid,
    product_id   uuid,
    printing_id  uuid,
    quantity     integer,
    product_name text,
    price        numeric,
    image_url    text,
    set_code     text,
    stock        integer,
    finish       text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
BEGIN
    SELECT id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id;

    IF v_cart_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        ci.id           AS cart_item_id,
        p.id            AS product_id,
        p.printing_id,
        ci.quantity,
        p.name          AS product_name,
        p.price,
        p.image_url,
        p.set_code,
        p.stock,
        LOWER(COALESCE(p.finish, 'nonfoil')) AS finish
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.id DESC;   -- cart_items has no created_at; id is monotonically increasing
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid) TO authenticated;

-- ============================================================
-- FIX 2: get_unique_cards_optimized — remove avg_market_price_foil_usd
-- The current mv_unique_cards (from 20260310_simplify_pricing_to_ck_nm.sql)
-- does NOT have this column. The function must match the MV schema.
-- ============================================================
DROP FUNCTION IF EXISTS public.get_unique_cards_optimized(text,integer[],text[],text[],text[],text[],integer,integer,integer,integer,text);

CREATE OR REPLACE FUNCTION public.get_unique_cards_optimized(
  search_query TEXT DEFAULT NULL,
  game_ids INTEGER[] DEFAULT NULL,
  rarity_filter TEXT[] DEFAULT NULL,
  set_names TEXT[] DEFAULT NULL,
  color_codes TEXT[] DEFAULT NULL,
  type_filter TEXT[] DEFAULT NULL,
  year_from INTEGER DEFAULT NULL,
  year_to INTEGER DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'release_date'
)
RETURNS TABLE (
  printing_id UUID,
  card_id UUID,
  card_name TEXT,
  image_url TEXT,
  set_name TEXT,
  set_code TEXT,
  rarity TEXT,
  type_line TEXT,
  colors TEXT[],
  release_date DATE,
  avg_market_price_usd NUMERIC,
  store_price NUMERIC,
  game_id INTEGER,
  cmc NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mv.printing_id,
    mv.card_id,
    mv.card_name,
    mv.image_url,
    mv.set_name,
    mv.set_code,
    mv.rarity,
    mv.type_line,
    mv.colors,
    mv.release_date,
    mv.avg_market_price_usd,
    mv.store_price,
    mv.game_id,
    mv.cmc
  FROM public.mv_unique_cards mv
  WHERE
    (search_query IS NULL OR mv.card_name ILIKE '%' || search_query || '%')
    AND (game_ids IS NULL OR mv.game_id = ANY(game_ids))
    AND (rarity_filter IS NULL OR LOWER(mv.rarity) = ANY(rarity_filter))
    AND (set_names IS NULL OR mv.set_name = ANY(set_names))
    AND (color_codes IS NULL OR mv.colors && color_codes)
    AND (type_filter IS NULL OR EXISTS (
        SELECT 1 FROM unnest(type_filter) AS t WHERE mv.type_line ILIKE '%' || t || '%'
    ))
    AND (year_from IS NULL OR EXTRACT(YEAR FROM mv.release_date) >= year_from)
    AND (year_to IS NULL OR EXTRACT(YEAR FROM mv.release_date) <= year_to)
  ORDER BY
    CASE
      WHEN sort_by = 'name' THEN mv.card_name
      ELSE NULL
    END ASC,
    CASE
      WHEN sort_by = 'newest' OR sort_by = 'release_date' THEN mv.release_date
      ELSE NULL
    END DESC NULLS LAST,
    CASE
      WHEN sort_by = 'mana_asc' THEN mv.cmc
      ELSE NULL
    END ASC,
    CASE
      WHEN sort_by = 'mana_desc' THEN mv.cmc
      ELSE NULL
    END DESC NULLS LAST,
    CASE
      WHEN sort_by = 'price_asc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, 0)
      ELSE NULL
    END ASC,
    CASE
      WHEN sort_by = 'price_desc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, 0)
      ELSE NULL
    END DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unique_cards_optimized(text,integer[],text[],text[],text[],text[],integer,integer,integer,integer,text) TO authenticated, anon;
