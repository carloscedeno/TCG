-- Migration: Add btree index on card_printings(api_source_id) and cards(card_name)
-- Also relax fn_validate_tcg_attributes so Trainer/Energy/Event/FAB cards from SortSwift/TCGplayer do not fail on insert.

CREATE INDEX IF NOT EXISTS idx_card_printings_api_source_id ON public.card_printings(api_source_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_name ON public.cards(card_name);

CREATE OR REPLACE FUNCTION public.fn_validate_tcg_attributes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.tcg_specific_attributes IS NULL THEN
        NEW.tcg_specific_attributes := '{}'::jsonb;
    END IF;
    RETURN NEW;
END;
$function$;
