-- Migration to strictly enforce Card Kingdom (CK) Near Mint (NM) prices as the single source of truth
-- Optimized version: Denormalizes prices into cards table using high-performance batch updates.

BEGIN;

-- Set search path
SET search_path = public, extensions;

-- 1. PRE-REQUISITE: Ensure necessary columns exist
-- Adding avg_market_price_usd to card_printings for high-performance per-version pricing
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_usd NUMERIC;

-- Cleaning up the previous denormalized column from cards (moved to card_printings)
ALTER TABLE public.cards DROP COLUMN IF EXISTS avg_market_price_usd;

-- Adding purchase_price to user_collections if it's missing (needed for stats)
ALTER TABLE public.user_collections ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;

-- 2. Optimized Backfill (Single pass batch update)
-- This populates card_printings.avg_market_price_usd directly from the latest CK NM price.
WITH latest_ck_nm_prices AS (
    -- Get only the latest CK NM price for each printing_id
    SELECT DISTINCT ON (ph.printing_id)
        ph.printing_id,
        ph.price_usd
    FROM public.price_history ph
    WHERE ph.source_id = (SELECT s.source_id FROM public.sources s WHERE UPPER(s.source_code) = 'CARDKINGDOM' LIMIT 1)
    AND ph.condition_id = (SELECT c.condition_id FROM public.conditions c WHERE UPPER(c.condition_code) = 'NM' LIMIT 1)
    ORDER BY ph.printing_id, ph.timestamp DESC
)
UPDATE public.card_printings cp
SET avg_market_price_usd = lp.price_usd
FROM latest_ck_nm_prices lp
WHERE cp.printing_id = lp.printing_id;

-- 3. Update the helper function to strictly filter for CK and NM
CREATE OR REPLACE FUNCTION public.get_latest_ck_price(p_printing_id UUID) 
RETURNS NUMERIC AS $$
    SELECT price_usd 
    FROM public.price_history 
    WHERE printing_id = p_printing_id 
    AND source_id = (SELECT source_id FROM public.sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
    AND condition_id = (SELECT c.condition_id FROM public.conditions c WHERE UPPER(c.condition_code) = 'NM' LIMIT 1)
    ORDER BY timestamp DESC 
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 4. Drop and recreate the Materialized View 
-- Uses the denormalized column for maximum search performance
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
    -- Optimized: Use the denormalized column from card_printings
    cp.avg_market_price_usd,
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

-- 5. Restore indices for high-performance search
CREATE INDEX idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX idx_mv_unique_cards_release_date ON public.mv_unique_cards(release_date DESC);
CREATE INDEX idx_mv_unique_cards_game_id ON public.mv_unique_cards(game_id);
CREATE INDEX idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);

-- 6. Optimized Card Query RPC
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

-- 7. Standard Search RPC (legacy but used by frontend)
DROP FUNCTION IF EXISTS public.search_cards_with_prices(text,text,integer);

CREATE OR REPLACE FUNCTION public.search_cards_with_prices(
    search_query TEXT,
    game_code_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    card_id UUID,
    card_name TEXT,
    game_name TEXT,
    set_name TEXT,
    collector_number TEXT,
    rarity TEXT,
    avg_price_usd NUMERIC,
    low_price_usd NUMERIC,
    high_price_usd NUMERIC,
    price_count INTEGER,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.card_id,
        c.card_name,
        g.game_name,
        s.set_name,
        cp.collector_number,
        c.rarity,
        -- Efficient: pulls from the denormalized column in card_printings
        cp.avg_market_price_usd as avg_price_usd,
        cp.avg_market_price_usd as low_price_usd,
        cp.avg_market_price_usd as high_price_usd,
        1 as price_count,
        cp.image_url::TEXT
    FROM public.cards c
    JOIN public.games g ON c.game_id = g.game_id
    JOIN public.card_printings cp ON c.card_id = cp.card_id
    JOIN public.sets s ON cp.set_id = s.set_id
    WHERE 
        (search_query IS NULL OR c.card_name ILIKE '%' || search_query || '%')
        AND (game_code_filter IS NULL OR g.game_code = game_code_filter)
    ORDER BY c.card_name, s.release_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. Collection Stats RPC
-- Optimized to use the denormalized column and purchase_price
DROP FUNCTION IF EXISTS public.get_user_collection_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_user_collection_stats(user_uuid UUID)
RETURNS TABLE (
    total_cards BIGINT,
    total_quantity BIGINT,
    total_value_usd NUMERIC,
    total_value_eur NUMERIC,
    avg_purchase_price_usd NUMERIC,
    cards_with_purchase_price BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT uc.printing_id) as total_cards,
        SUM(uc.quantity) as total_quantity,
        -- Use the helper which is fast for single prints, or we could join cards but printing_id is safer here
        SUM(uc.quantity * COALESCE(public.get_latest_ck_price(uc.printing_id), 0)) as total_value_usd,
        0::NUMERIC as total_value_eur,
        AVG(uc.purchase_price) as avg_purchase_price_usd,
        COUNT(uc.purchase_price) as cards_with_purchase_price
    FROM public.user_collections uc
    WHERE uc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMIT;
