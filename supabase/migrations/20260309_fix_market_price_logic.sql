-- Migration to fix market price logic in mv_unique_cards and get_latest_ck_price
-- Optimized version to prevent timeouts by using CTEs instead of scalar function calls in the view
-- Includes DROP FUNCTION to handle return type changes

BEGIN;

-- Set search path to ensure public tables are found
SET search_path = public, extensions;

-- 1. Still update the helper function for other uses (it's STABLE so safe)
CREATE OR REPLACE FUNCTION public.get_latest_ck_price(p_printing_id UUID, p_is_foil BOOLEAN DEFAULT false, p_is_etched BOOLEAN DEFAULT false) 
RETURNS NUMERIC AS $$
  SELECT price_usd 
  FROM public.price_history 
  WHERE printing_id = p_printing_id 
  AND is_foil = p_is_foil
  AND is_etched = p_is_etched
  AND source_id = (SELECT source_id FROM public.sources WHERE source_code = 'cardkingdom' LIMIT 1)
  ORDER BY timestamp DESC 
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 2. Drop and recreate the Materialized View with performance optimizations
DROP MATERIALIZED VIEW IF EXISTS public.mv_unique_cards CASCADE;

-- Optimized Materialized View Creation
CREATE MATERIALIZED VIEW public.mv_unique_cards AS
WITH latest_ck_prices AS (
    -- Efficiently get only the latest price for each printing/finish combination
    SELECT DISTINCT ON (ph.printing_id, ph.is_foil, ph.is_etched)
        ph.printing_id,
        ph.is_foil,
        ph.is_etched,
        ph.price_usd
    FROM public.price_history ph
    WHERE ph.source_id = (SELECT s.source_id FROM public.sources s WHERE s.source_code = 'cardkingdom' LIMIT 1)
    ORDER BY ph.printing_id, ph.is_foil, ph.is_etched, ph.timestamp DESC
)
SELECT DISTINCT ON (c.card_name)
    cp.printing_id,
    c.card_id,
    c.card_name::TEXT,
    cp.image_url::TEXT,
    s.set_name::TEXT,
    s.set_code::TEXT,
    c.rarity::TEXT,
    c.type_line::TEXT,
    c.colors,
    s.release_date,
    -- Match the price to the printing's finish directly from the CTE join
    lp.price_usd as avg_market_price_usd,
    p.price as store_price,
    c.game_id,
    c.cmc,
    cp.lang
FROM public.card_printings cp
INNER JOIN public.cards c ON cp.card_id = c.card_id
INNER JOIN public.sets s ON cp.set_id = s.set_id
LEFT JOIN public.products p ON cp.printing_id = p.printing_id
LEFT JOIN latest_ck_prices lp ON (
    lp.printing_id = cp.printing_id 
    AND lp.is_foil = cp.is_foil 
    AND lp.is_etched = cp.is_etched
)
WHERE (cp.lang = 'en' OR cp.lang IS NULL)
ORDER BY 
    c.card_name,
    s.release_date DESC NULLS LAST,
    cp.is_foil ASC,    -- Prefer non-foil printings as representative
    cp.is_etched ASC;  -- Prefer non-etched printings as representative

-- 3. Re-create indices (Crucial for search performance)
CREATE INDEX idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX idx_mv_unique_cards_release_date ON public.mv_unique_cards(release_date DESC);
CREATE INDEX idx_mv_unique_cards_game_id ON public.mv_unique_cards(game_id);
CREATE INDEX idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);

-- 4. Re-create the RPC function
-- IMPORTANT: Must drop first because return types (derived from MV) might have changed
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

COMMIT;
