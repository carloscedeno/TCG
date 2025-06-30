-- 005_add_artist_to_cards.sql
-- Agrega la columna 'artist' a la tabla 'cards' para almacenar el nombre del artista de la carta (MTG y otros TCG).
-- Idempotente: solo agrega la columna si no existe.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='cards' AND column_name='artist'
    ) THEN
        ALTER TABLE cards ADD COLUMN artist TEXT;
    END IF;
END $$; 