-- 010_add_scryfall_extras_to_card_printings.sql
-- Agrega campos adicionales de Scryfall a la tabla 'card_printings' para máxima compatibilidad y flexibilidad.
-- Todos los ALTER TABLE son idempotentes.

ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS frame_effects TEXT[];
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS promo_types TEXT[];
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS full_art BOOLEAN;
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS textless BOOLEAN;
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS oversized BOOLEAN;
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS variation BOOLEAN;
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS finishes TEXT[]; 