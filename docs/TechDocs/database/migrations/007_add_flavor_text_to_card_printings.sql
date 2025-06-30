-- 007_add_flavor_text_to_card_printings.sql
-- Agrega la columna 'flavor_text' a la tabla 'card_printings' para almacenar el texto de ambientación de la carta (MTG y otros TCG).
-- Idempotente: solo agrega la columna si no existe.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='card_printings' AND column_name='flavor_text'
    ) THEN
        ALTER TABLE card_printings ADD COLUMN flavor_text TEXT;
    END IF;
END $$; 