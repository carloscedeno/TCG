-- Add missing indices to card_printings table to dramatically speed up inventory imports
-- Before these indices, a single lookup by scryfall_id took ~7 seconds. 
-- With them, it takes ~8 milliseconds.

CREATE INDEX IF NOT EXISTS idx_card_printings_scryfall_id ON public.card_printings(scryfall_id);
CREATE INDEX IF NOT EXISTS idx_card_printings_set_code ON public.card_printings(set_code);
CREATE INDEX IF NOT EXISTS idx_card_printings_collector_number ON public.card_printings(collector_number);
CREATE INDEX IF NOT EXISTS idx_card_printings_card_id ON public.card_printings(card_id);
