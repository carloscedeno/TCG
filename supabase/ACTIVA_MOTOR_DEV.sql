-- =============================================================================
-- ACTIVA_MOTOR_DEV (Restauración del Motor de Búsqueda y RPCs)
-- =============================================================================
-- Este script activa la "inteligencia" del sitio recreando las vistas y funciones
-- críticas que el frontend espera encontrar.
-- =============================================================================

BEGIN;

-- 1. REFUERZO DE COLUMNAS (Asegurar campos necesarios para el motor)
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS rarity TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS type_line TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS colors TEXT[];
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS cmc NUMERIC;

ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_usd NUMERIC;
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_foil_usd NUMERIC;
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'en';
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. VISTA MATERIALIZADA (Motor de Búsqueda de Catálogo)
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

-- Índices para la Vista
CREATE INDEX IF NOT EXISTS idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX IF NOT EXISTS idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);

-- 3. RPC: search_card_names (Autocompletado)
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

-- 4. RPC: get_unique_cards_optimized (Grid Principal)
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

-- 5. REFRESCAR MOTOR
REFRESH MATERIALIZED VIEW public.mv_unique_cards;

COMMIT;
