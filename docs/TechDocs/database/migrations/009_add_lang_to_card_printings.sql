-- 009_add_lang_to_card_printings.sql
-- Agrega la columna 'lang' a la tabla 'card_printings' para almacenar el idioma de la impresión (MTG y otros TCG).
-- Idempotente: solo agrega la columna si no existe.
 
ALTER TABLE card_printings ADD COLUMN IF NOT EXISTS lang TEXT; 