-- Migration to add a separate column for foil prices to handle CK NM pricing mismatches
BEGIN;

-- 1. Add the column
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_foil_usd NUMERIC;

-- 2. Update the helper function to support foil/non-foil
CREATE OR REPLACE FUNCTION public.get_latest_ck_price(p_printing_id UUID, p_is_foil BOOLEAN DEFAULT FALSE) 
RETURNS NUMERIC AS $$
    SELECT price_usd 
    FROM public.price_history 
    WHERE printing_id = p_printing_id 
    AND source_id = (SELECT source_id FROM public.sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
    AND condition_id = (SELECT c.condition_id FROM public.conditions c WHERE UPPER(c.condition_code) = 'NM' LIMIT 1)
    AND is_foil = p_is_foil
    ORDER BY timestamp DESC 
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 3. Backfill
-- Non-foil
WITH latest_ck_nm_prices AS (
    SELECT DISTINCT ON (ph.printing_id)
        ph.printing_id,
        ph.price_usd
    FROM public.price_history ph
    WHERE ph.source_id = (SELECT s.source_id FROM public.sources s WHERE UPPER(s.source_code) = 'CARDKINGDOM' LIMIT 1)
    AND ph.condition_id = (SELECT c.condition_id FROM public.conditions c WHERE UPPER(c.condition_code) = 'NM' LIMIT 1)
    AND ph.is_foil = FALSE
    ORDER BY ph.printing_id, ph.timestamp DESC
)
UPDATE public.card_printings cp
SET avg_market_price_usd = lp.price_usd
FROM latest_ck_nm_prices lp
WHERE cp.printing_id = lp.printing_id;

-- Foil
WITH latest_ck_nm_foil_prices AS (
    SELECT DISTINCT ON (ph.printing_id)
        ph.printing_id,
        ph.price_usd
    FROM public.price_history ph
    WHERE ph.source_id = (SELECT s.source_id FROM public.sources s WHERE UPPER(s.source_code) = 'CARDKINGDOM' LIMIT 1)
    AND ph.condition_id = (SELECT c.condition_id FROM public.conditions c WHERE UPPER(c.condition_code) = 'NM' LIMIT 1)
    AND ph.is_foil = TRUE
    ORDER BY ph.printing_id, ph.timestamp DESC
)
UPDATE public.card_printings cp
SET avg_market_price_foil_usd = lp.price_usd
FROM latest_ck_nm_foil_prices lp
WHERE cp.printing_id = lp.printing_id;

-- 4. Update the Materialized View
DROP MATERIALIZED VIEW IF EXISTS public.mv_unique_cards CASCADE;

CREATE MATERIALIZED VIEW public.mv_unique_cards AS
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
    cp.avg_market_price_usd,
    cp.avg_market_price_foil_usd,
    p.price as store_price,
    c.game_id,
    c.cmc,
    cp.lang
FROM public.card_printings cp
INNER JOIN public.cards c ON cp.card_id = c.card_id
INNER JOIN public.sets s ON cp.set_id = s.set_id
LEFT JOIN public.products p ON cp.printing_id = p.printing_id
WHERE (cp.lang = 'en' OR cp.lang IS NULL)
ORDER BY 
    c.card_name,
    s.release_date DESC NULLS LAST,
    cp.is_foil ASC,
    cp.is_etched ASC;

-- Restore indices
CREATE INDEX idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX idx_mv_unique_cards_release_date ON public.mv_unique_cards(release_date DESC);
CREATE INDEX idx_mv_unique_cards_game_id ON public.mv_unique_cards(game_id);
CREATE INDEX idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);

-- 5. Update Search RPCs
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
  avg_market_price_foil_usd NUMERIC,
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
    mv.avg_market_price_foil_usd,
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
      WHEN sort_by = 'price_asc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, mv.avg_market_price_foil_usd, 0) 
      ELSE NULL 
    END ASC,
    CASE 
      WHEN sort_by = 'price_desc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, mv.avg_market_price_foil_usd, 0) 
      ELSE NULL 
    END DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

COMMIT;
