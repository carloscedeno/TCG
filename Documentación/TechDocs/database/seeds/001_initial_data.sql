-- Datos iniciales del sistema
-- Fecha: 2025-01-28
-- Descripción: Insertar datos básicos necesarios para el funcionamiento del sistema

-- 1. Insertar juegos soportados
INSERT INTO games (game_name, game_code) VALUES
('Magic: The Gathering', 'MTG'),
('Pokémon', 'POKEMON'),
('Lorcana', 'LORCANA'),
('Flesh and Blood', 'FAB'),
('Yu-Gi-Oh!', 'YUGIOH'),
('Wixoss', 'WIXOSS'),
('One Piece', 'ONEPIECE')
ON CONFLICT (game_code) DO NOTHING;

-- 2. Insertar condiciones estándar
INSERT INTO conditions (condition_name, condition_code, sort_order) VALUES
('Near Mint', 'NM', 1),
('Lightly Played', 'LP', 2),
('Moderately Played', 'MP', 3),
('Heavily Played', 'HP', 4),
('Damaged', 'DM', 5)
ON CONFLICT (condition_code) DO NOTHING;

-- 3. Insertar fuentes de precios
INSERT INTO sources (source_name, source_code, website_url) VALUES
('TCGplayer', 'TCGPLAYER', 'https://www.tcgplayer.com'),
('Card Kingdom', 'CARDKINGDOM', 'https://www.cardkingdom.com'),
('Cardmarket', 'CARDMARKET', 'https://www.cardmarket.com'),
('Troll and Toad', 'TROLLANDTOAD', 'https://www.trollandtoad.com')
ON CONFLICT (source_code) DO NOTHING;

-- 4. Insertar sets de ejemplo para Magic: The Gathering
INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, is_promo) VALUES
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander 2021', 'c21', '2021-04-23', false, false),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander 2022', 'c22', '2022-06-10', false, false),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander 2023', 'c23', '2023-08-04', false, false),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander Masters', 'cmm', '2023-08-04', false, false),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'The Lost Caverns of Ixalan', 'lci', '2023-11-17', false, false),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Murders at Karlov Manor', 'mkm', '2024-02-09', false, false)
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 5. Insertar sets de ejemplo para Pokémon
INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, is_promo) VALUES
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Base Set', 'base1', '1999-01-09', false, false),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Jungle', 'base2', '1999-06-16', false, false),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Fossil', 'base3', '1999-10-10', false, false),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Scarlet & Violet', 'sv1', '2023-03-31', false, false),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Scarlet & Violet—Paldea Evolved', 'sv2', '2023-06-09', false, false),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Scarlet & Violet—Obsidian Flames', 'sv3', '2023-08-11', false, false)
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 6. Insertar sets de ejemplo para Lorcana
INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, is_promo) VALUES
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'The First Chapter', 'tfc', '2023-08-18', false, false),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Rise of the Floodborn', 'rotf', '2023-11-17', false, false),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Into the Inklands', 'iti', '2024-02-23', false, false)
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 7. Insertar cartas de ejemplo para Magic: The Gathering
INSERT INTO cards (game_id, card_name, type_line, oracle_text, mana_cost, base_rarity) VALUES
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Sol Ring', 'Artifact', '{T}: Add {C}{C}.', '{1}', 'uncommon'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Arcane Signet', 'Artifact', '{T}: Add one mana of any color in your commander''s color identity.', '{2}', 'common'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Command Tower', 'Land', '{T}: Add one mana of any color in your commander''s color identity.', NULL, 'common'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Counterspell', 'Instant', 'Counter target spell.', '{U}{U}', 'common'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Lightning Bolt', 'Instant', 'Lightning Bolt deals 3 damage to any target.', '{R}', 'common')
ON CONFLICT (game_id, card_name) DO NOTHING;

-- 8. Insertar cartas de ejemplo para Pokémon
INSERT INTO cards (game_id, card_name, type_line, oracle_text, mana_cost, base_rarity) VALUES
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Charizard', 'Pokémon', 'Fire Spin: Discard 2 Energy cards attached to Charizard in order to use this attack.', NULL, 'holographic'),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Pikachu', 'Pokémon', 'Thunder Shock: Flip a coin. If heads, the Defending Pokémon is now Paralyzed.', NULL, 'common'),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Blastoise', 'Pokémon', 'Hydro Pump: Does 40 damage plus 10 more damage for each Water Energy attached to Blastoise but not used to pay for this attack.', NULL, 'holographic')
ON CONFLICT (game_id, card_name) DO NOTHING;

-- 9. Insertar cartas de ejemplo para Lorcana
INSERT INTO cards (game_id, card_name, type_line, oracle_text, mana_cost, base_rarity) VALUES
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Elsa - Spirit of Winter', 'Character', 'Frozen Heart: When this character enters play, choose an opposing character. That character can''t ready during their next ready step.', '{5}', 'legendary'),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Mickey Mouse - Brave Little Tailor', 'Character', 'Brave Little Tailor: When this character enters play, you may put a +1/+1 counter on another character you control.', '{3}', 'rare'),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Maleficent - Dragon Form', 'Character', 'Dragon Form: When this character enters play, you may put a +1/+1 counter on another character you control.', '{7}', 'legendary')
ON CONFLICT (game_id, card_name) DO NOTHING;

-- 10. Insertar impresiones de ejemplo
INSERT INTO card_printings (card_id, set_id, collector_number, rarity, is_foil, is_non_foil, artist, image_url_small, image_url_normal, image_url_large) VALUES
-- Sol Ring de Commander 2021
((SELECT card_id FROM cards WHERE card_name = 'Sol Ring' AND game_id = (SELECT game_id FROM games WHERE game_code = 'MTG')), 
 (SELECT set_id FROM sets WHERE set_code = 'c21' AND game_id = (SELECT game_id FROM games WHERE game_code = 'MTG')), 
 '127', 'uncommon', false, true, 'Volkan Baga', 
 'https://cards.scryfall.io/small/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg',
 'https://cards.scryfall.io/normal/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg',
 'https://cards.scryfall.io/large/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg'),

-- Charizard de Base Set
((SELECT card_id FROM cards WHERE card_name = 'Charizard' AND game_id = (SELECT game_id FROM games WHERE game_code = 'POKEMON')), 
 (SELECT set_id FROM sets WHERE set_code = 'base1' AND game_id = (SELECT game_id FROM games WHERE game_code = 'POKEMON')), 
 '4', 'holographic', false, true, 'Mitsuhiro Arita',
 'https://images.pokemontcg.io/base1/4.png',
 'https://images.pokemontcg.io/base1/4.png',
 'https://images.pokemontcg.io/base1/4_hires.png'),

-- Elsa de The First Chapter
((SELECT card_id FROM cards WHERE card_name = 'Elsa - Spirit of Winter' AND game_id = (SELECT game_id FROM games WHERE game_code = 'LORCANA')), 
 (SELECT set_id FROM sets WHERE set_code = 'tfc' AND game_id = (SELECT game_id FROM games WHERE game_code = 'LORCANA')), 
 '172', 'legendary', false, true, 'Disney',
 'https://example.com/elsa-small.jpg',
 'https://example.com/elsa-normal.jpg',
 'https://example.com/elsa-large.jpg')
ON CONFLICT (set_id, collector_number, is_foil, is_etched) DO NOTHING;

-- 11. Insertar precios de ejemplo (datos históricos simulados)
INSERT INTO price_history (printing_id, source_id, condition_id, price_usd, price_eur, stock_quantity, timestamp) VALUES
-- Sol Ring NM en TCGplayer
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Sol Ring' AND s.set_code = 'c21' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'TCGPLAYER'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 1.25, 1.15, 50, NOW() - INTERVAL '1 day'),

-- Sol Ring NM en Card Kingdom
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Sol Ring' AND s.set_code = 'c21' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'CARDKINGDOM'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 1.50, 1.40, 25, NOW() - INTERVAL '1 day'),

-- Charizard NM en TCGplayer
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Charizard' AND s.set_code = 'base1' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'TCGPLAYER'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 350.00, 320.00, 5, NOW() - INTERVAL '1 day'),

-- Elsa NM en TCGplayer
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Elsa - Spirit of Winter' AND s.set_code = 'tfc' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'TCGPLAYER'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 45.50, 42.00, 15, NOW() - INTERVAL '1 day')
ON CONFLICT (printing_id, source_id, condition_id, DATE(timestamp)) DO NOTHING;

-- 12. Calcular precios agregados iniciales
-- Nota: Los triggers deberían manejar esto automáticamente, pero insertamos algunos manualmente para el ejemplo
INSERT INTO aggregated_prices (printing_id, condition_id, avg_market_price_usd, avg_market_price_eur, buy_price_usd, buy_price_eur, price_count, last_updated) VALUES
-- Sol Ring NM
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Sol Ring' AND s.set_code = 'c21' AND cp.is_foil = false), 
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 1.38, 1.28, 0.83, 0.77, 2, NOW()),

-- Charizard NM
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Charizard' AND s.set_code = 'base1' AND cp.is_foil = false), 
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 350.00, 320.00, 210.00, 192.00, 1, NOW()),

-- Elsa NM
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Elsa - Spirit of Winter' AND s.set_code = 'tfc' AND cp.is_foil = false), 
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 45.50, 42.00, 27.30, 25.20, 1, NOW())
ON CONFLICT (printing_id, condition_id) DO UPDATE SET
    avg_market_price_usd = EXCLUDED.avg_market_price_usd,
    avg_market_price_eur = EXCLUDED.avg_market_price_eur,
    buy_price_usd = EXCLUDED.buy_price_usd,
    buy_price_eur = EXCLUDED.buy_price_eur,
    price_count = EXCLUDED.price_count,
    last_updated = EXCLUDED.last_updated;

-- Comentarios para documentación
COMMENT ON TABLE games IS 'Datos iniciales: Juegos soportados por la plataforma';
COMMENT ON TABLE conditions IS 'Datos iniciales: Condiciones estándar de las cartas';
COMMENT ON TABLE sources IS 'Datos iniciales: Fuentes de precios principales';
COMMENT ON TABLE sets IS 'Datos iniciales: Sets de ejemplo para cada juego';
COMMENT ON TABLE cards IS 'Datos iniciales: Cartas de ejemplo para testing';
COMMENT ON TABLE card_printings IS 'Datos iniciales: Impresiones de ejemplo con imágenes';
COMMENT ON TABLE price_history IS 'Datos iniciales: Precios históricos simulados';
COMMENT ON TABLE aggregated_prices IS 'Datos iniciales: Precios agregados calculados'; 