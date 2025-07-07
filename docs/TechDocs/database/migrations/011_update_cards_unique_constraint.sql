-- 011_update_cards_unique_constraint.sql
-- Elimina la restricción única (game_id, card_name) y la reemplaza por una restricción única en card_id para soportar correctamente cartas con el mismo nombre en MTG y otros TCG.
 
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_game_id_card_name_key;
ALTER TABLE cards ADD CONSTRAINT IF NOT EXISTS cards_card_id_key UNIQUE (card_id); 