-- Migrate avg_market_price_usd to strictly mirror Card Kingdom NM prices
-- Non-foil prices
UPDATE public.card_printings cp
SET avg_market_price_usd = (
    SELECT price_usd 
    FROM public.price_history ph 
    WHERE ph.printing_id = cp.printing_id 
      AND ph.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
      AND ph.is_foil = false
    ORDER BY ph.timestamp DESC LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM public.price_history ph2 
    WHERE ph2.printing_id = cp.printing_id 
      AND ph2.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
      AND ph2.is_foil = false
);

-- Foil prices
UPDATE public.card_printings cp
SET avg_market_price_foil_usd = (
    SELECT price_usd 
    FROM public.price_history ph 
    WHERE ph.printing_id = cp.printing_id 
      AND ph.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
      AND ph.is_foil = true
    ORDER BY ph.timestamp DESC LIMIT 1
)
WHERE EXISTS (
    SELECT 1 
    FROM public.price_history ph2 
    WHERE ph2.printing_id = cp.printing_id 
      AND ph2.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
      AND ph2.is_foil = true
);

-- Refresh the materialized view so changes appear in search
REFRESH MATERIALIZED VIEW public.mv_unique_cards;
