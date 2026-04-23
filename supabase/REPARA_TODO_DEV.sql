-- =============================================================================
-- REPARA_TODO_DEV.sql
-- Consolidated fix for missing relations and search motor restoration
-- =============================================================================

BEGIN;

-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Ensure required columns exist (Defensive)
DO $$ 
BEGIN
    -- Cards columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='rarity') THEN
        ALTER TABLE public.cards ADD COLUMN rarity TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='type_line') THEN
        ALTER TABLE public.cards ADD COLUMN type_line TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='colors') THEN
        ALTER TABLE public.cards ADD COLUMN colors TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='cmc') THEN
        ALTER TABLE public.cards ADD COLUMN cmc NUMERIC;
    END IF;

    -- Card Printings columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='avg_market_price_usd') THEN
        ALTER TABLE public.card_printings ADD COLUMN avg_market_price_usd NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='avg_market_price_foil_usd') THEN
        ALTER TABLE public.card_printings ADD COLUMN avg_market_price_foil_usd NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='image_url') THEN
        ALTER TABLE public.card_printings ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. RECREATE MATERIALIZED VIEW (Critical fix)
DROP MATERIALIZED VIEW IF EXISTS public.mv_unique_cards CASCADE;

CREATE MATERIALIZED VIEW public.mv_unique_cards AS
SELECT DISTINCT ON (c.card_name)
    cp.printing_id,
    c.card_id,
    c.card_name::TEXT,
    COALESCE(cp.image_url, cp.image_url_normal)::TEXT as image_url,
    s.set_name::TEXT,
    s.set_code::TEXT,
    COALESCE(c.rarity, cp.rarity)::TEXT as rarity,
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
    s.release_date DESC NULLS LAST;

-- Indices for MV
CREATE INDEX IF NOT EXISTS idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX IF NOT EXISTS idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mv_unique_cards_game_id ON public.mv_unique_cards(game_id);

-- 3. RECREATE RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.search_card_names(query_text TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (card_name TEXT) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT name::TEXT
    FROM (
        SELECT p.name FROM public.products p WHERE p.name ILIKE query_text || '%'
        UNION
        SELECT c.card_name FROM public.cards c WHERE c.card_name ILIKE query_text || '%'
    ) s
    LIMIT limit_count;
END;
$$;

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
    mv.printing_id, mv.card_id, mv.card_name, mv.image_url,
    mv.set_name, mv.set_code, mv.rarity, mv.type_line,
    mv.colors, mv.release_date, mv.avg_market_price_usd,
    mv.avg_market_price_foil_usd, mv.store_price, mv.game_id, mv.cmc
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
    CASE WHEN sort_by = 'name' THEN mv.card_name ELSE NULL END ASC,
    CASE WHEN sort_by IN ('newest','release_date') THEN mv.release_date ELSE NULL END DESC NULLS LAST,
    CASE WHEN sort_by = 'price_asc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, 0) ELSE NULL END ASC,
    CASE WHEN sort_by = 'price_desc' THEN COALESCE(mv.store_price, mv.avg_market_price_usd, 0) ELSE NULL END DESC NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_mv()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.mv_unique_cards;
END;
$$;

-- 4. FINAL REFRESH
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
CREATE POLICY "Public read access for products" ON public.products FOR SELECT USING (true);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for cards" ON public.cards;
CREATE POLICY "Public read access for cards" ON public.cards FOR SELECT USING (true);

ALTER TABLE public.card_printings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for card_printings" ON public.card_printings;
CREATE POLICY "Public read access for card_printings" ON public.card_printings FOR SELECT USING (true);

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for sets" ON public.sets;
CREATE POLICY "Public read access for sets" ON public.sets FOR SELECT USING (true);

REFRESH MATERIALIZED VIEW public.mv_unique_cards;

COMMIT;
