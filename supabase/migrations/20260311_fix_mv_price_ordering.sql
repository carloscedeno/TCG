-- Migration: Fix price display for cards where newest printing lacks price data
-- Problem: mv_unique_cards uses DISTINCT ON (card_name) ordered by release_date DESC.
--          The newest printing is shown first, but may not have CK price data yet.
--          This causes "S/P" to appear even when older printings have prices.
-- Solution: Change ORDER BY to prefer printings WITH prices while still showing
--           the newest available among priced printings, falling back gracefully.
-- Date: 2026-03-11

BEGIN;

-- Drop and recreate the materialized view with improved ORDER BY
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
    -- Use denormalized column from card_printings (populated by sync script)
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
    -- KEY FIX: Prefer printings that have a price (NULL prices go last)
    (cp.avg_market_price_usd IS NOT NULL) DESC,
    -- Among priced printings, prefer newest set
    s.release_date DESC NULLS LAST,
    cp.is_foil ASC,
    cp.is_etched ASC;

-- Restore all performance indexes
CREATE INDEX idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX idx_mv_unique_cards_release_date ON public.mv_unique_cards(release_date DESC);
CREATE INDEX idx_mv_unique_cards_game_id ON public.mv_unique_cards(game_id);
CREATE INDEX idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);
CREATE INDEX idx_mv_unique_cards_price ON public.mv_unique_cards(avg_market_price_usd) WHERE avg_market_price_usd IS NOT NULL;

COMMIT;
