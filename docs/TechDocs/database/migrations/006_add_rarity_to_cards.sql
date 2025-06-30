-- 006_add_rarity_to_cards.sql
-- Agrega la columna 'rarity' a la tabla 'cards' para almacenar la rareza de la carta (MTG y otros TCG).
-- Idempotente: solo agrega la columna si no existe.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cards' AND column_name='rarity'
    ) THEN
        ALTER TABLE cards ADD COLUMN rarity TEXT;
    END IF;
END $$; 