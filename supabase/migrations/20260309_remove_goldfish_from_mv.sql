-- Migration to remove aggregated_prices dependency from mv_unique_cards
-- and switch to the latest price_history (Card Kingdom) for market data.

BEGIN;

-- 1. Create a helper function to get latest CK price for the view
-- This avoids complex subqueries in the view itself
CREATE OR REPLACE FUNCTION get_latest_ck_price(p_printing_id UUID) 
RETURNS NUMERIC AS $$
  SELECT price_usd 
  FROM price_history 
  WHERE printing_id = p_printing_id 
  AND source_id = (SELECT source_id FROM sources WHERE source_code = 'cardkingdom' LIMIT 1)
  ORDER BY timestamp DESC 
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 2. Drop and recreate the Materialized View
DROP MATERIALIZED VIEW IF EXISTS mv_unique_cards CASCADE;

CREATE MATERIALIZED VIEW mv_unique_cards AS
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
    get_latest_ck_price(cp.printing_id) as avg_market_price_usd,
    p.price as store_price,
    c.game_id,
    c.cmc,
    cp.lang
FROM card_printings cp
INNER JOIN cards c ON cp.card_id = c.card_id
INNER JOIN sets s ON cp.set_id = s.set_id
LEFT JOIN products p ON cp.printing_id = p.printing_id
WHERE (cp.lang = 'en' OR cp.lang IS NULL)
ORDER BY 
    c.card_name,
    s.release_date DESC NULLS LAST;

-- 3. Re-create indices for the Materialized View
CREATE INDEX idx_mv_unique_cards_name ON mv_unique_cards(card_name);
CREATE INDEX idx_mv_unique_cards_release_date ON mv_unique_cards(release_date DESC);
CREATE INDEX idx_mv_unique_cards_game_id ON mv_unique_cards(game_id);
CREATE INDEX idx_mv_unique_cards_trgm ON mv_unique_cards USING gin (card_name gin_trgm_ops);

-- 4. Re-create the RPC function (it depends on the view structure)
CREATE OR REPLACE FUNCTION get_unique_cards_optimized(
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
  FROM mv_unique_cards mv
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
