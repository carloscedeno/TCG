-- 012_add_token_emblem_flags_to_card_printings.sql
-- Agrega los campos is_token y is_emblem a la tabla card_printings para identificar tokens y emblemas de Scryfall.
-- Idempotente.

ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS is_token BOOLEAN;
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS is_emblem BOOLEAN; 