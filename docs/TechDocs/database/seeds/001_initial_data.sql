-- Datos iniciales del sistema robusto para múltiples TCG
-- Fecha: 2025-01-28
-- Descripción: Insertar datos básicos necesarios para el funcionamiento del sistema multi-TCG

-- 1. Insertar juegos soportados con descripciones
INSERT INTO games (game_name, game_code, description) VALUES
('Magic: The Gathering', 'MTG', 'El primer y más popular juego de cartas coleccionables, con mecánicas de maná y hechizos'),
('Pokémon', 'POKEMON', 'Juego basado en la franquicia Pokémon con mecánicas de evolución y tipos de energía'),
('Lorcana', 'LORCANA', 'Juego de Disney con mecánicas de tinta y personajes icónicos'),
('Flesh and Blood', 'FAB', 'Juego competitivo con mecánicas de pitch y cadena de combate'),
('Yu-Gi-Oh!', 'YUGIOH', 'Juego japonés con mecánicas de fusión, sincronía y enlaces'),
('Wixoss', 'WIXOSS', 'Juego japonés con mazos duales y mecánicas de crecimiento'),
('One Piece', 'ONEPIECE', 'Juego basado en el anime One Piece con mecánicas de DON!!')
ON CONFLICT (game_code) DO NOTHING;

-- 2. Insertar condiciones estándar con descripciones
INSERT INTO conditions (condition_name, condition_code, sort_order, description) VALUES
('Near Mint', 'NM', 1, 'Desgaste mínimo, superficie casi sin marcas, esquinas nítidas'),
('Lightly Played', 'LP', 2, 'Desgaste menor en bordes, rasguños menores, sin problemas estructurales'),
('Moderately Played', 'MP', 3, 'Desgaste en bordes/superficie, arañazos, dobleces menores'),
('Heavily Played', 'HP', 4, 'Gran cantidad de desgaste, imperfecciones moderadas a graves'),
('Damaged', 'DM', 5, 'Defectos graves, desgarros, grandes dobleces o daños por agua')
ON CONFLICT (condition_code) DO NOTHING;

-- 3. Insertar fuentes de precios con información completa
INSERT INTO sources (source_name, source_code, website_url, logo_url, api_endpoint, api_key_required, rate_limit_per_minute) VALUES
('TCGplayer', 'TCGPLAYER', 'https://www.tcgplayer.com', 'https://www.tcgplayer.com/favicon.ico', 'https://api.tcgplayer.com', true, 60),
('Card Kingdom', 'CARDKINGDOM', 'https://www.cardkingdom.com', 'https://www.cardkingdom.com/favicon.ico', NULL, false, NULL),
('Cardmarket', 'CARDMARKET', 'https://www.cardmarket.com', 'https://www.cardmarket.com/favicon.ico', NULL, false, NULL),
('Troll and Toad', 'TROLLANDTOAD', 'https://www.trollandtoad.com', 'https://www.trollandtoad.com/favicon.ico', NULL, false, NULL),
('JustTCG', 'JUSTTCG', 'https://justtcg.com', 'https://justtcg.com/favicon.ico', 'https://api.justtcg.com', true, 120)
ON CONFLICT (source_code) DO NOTHING;

-- 4. Insertar atributos específicos por TCG
INSERT INTO card_attributes (game_id, attribute_name, attribute_type, description, is_required, sort_order) VALUES
-- Magic: The Gathering
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'loyalty', 'string', 'Lealtad de Planeswalkers', false, 1),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'defense', 'string', 'Defensa de Batallas', false, 2),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'frame_effects', 'array', 'Efectos de marco de la carta', false, 3),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'promo_types', 'array', 'Tipos de promocional', false, 4),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'illustration_id', 'string', 'ID único de la ilustración', false, 5),

-- Pokémon
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'hp', 'string', 'Puntos de salud del Pokémon', false, 1),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'evolves_from', 'string', 'Pokémon del que evoluciona', false, 2),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'evolves_to', 'array', 'Pokémon a los que evoluciona', false, 3),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'weaknesses', 'array', 'Debilidades del Pokémon', false, 4),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'resistances', 'array', 'Resistencias del Pokémon', false, 5),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'retreat_cost', 'array', 'Costo de retirada', false, 6),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'attacks', 'array', 'Ataques del Pokémon', false, 7),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'abilities', 'array', 'Habilidades del Pokémon', false, 8),

-- Lorcana
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'ink_color', 'string', 'Color de tinta de la carta', false, 1),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'inkwell', 'boolean', 'Si la carta puede ser entintada', false, 2),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'classifications', 'array', 'Clasificaciones adicionales', false, 3),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'strength', 'integer', 'Fuerza del personaje', false, 4),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'willpower', 'integer', 'Voluntad del personaje', false, 5),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'lore', 'integer', 'Saber del personaje', false, 6),

-- Flesh and Blood
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'pitch_value', 'integer', 'Valor de pitch (1-3)', false, 1),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'life', 'integer', 'Vida inicial del héroe', false, 2),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'intellect', 'integer', 'Intelecto del héroe', false, 3),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'class', 'string', 'Clase del héroe', false, 4),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'talents', 'array', 'Talentos del héroe', false, 5),

-- Yu-Gi-Oh!
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'level', 'integer', 'Nivel o Rango del monstruo', false, 1),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'race', 'string', 'Tipo de monstruo', false, 2),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'link', 'integer', 'Valor de Enlace', false, 3),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'linkmarkers', 'array', 'Marcadores de Enlace', false, 4),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'scale', 'integer', 'Valor de escala para Péndulo', false, 5),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'archetype', 'string', 'Arquetipo de la carta', false, 6),

-- Wixoss
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'color', 'string', 'Color de la carta', false, 1),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'level', 'integer', 'Nivel de la carta', false, 2),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'limit', 'integer', 'Límite de nivel para LRIGs', false, 3),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'grow_cost', 'integer', 'Costo de crecimiento', false, 4),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'has_life_burst', 'boolean', 'Si tiene habilidad Life Burst', false, 5),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'class', 'string', 'Clasificación adicional', false, 6),

-- One Piece
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'color', 'string', 'Color de la carta', false, 1),
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'counter', 'integer', 'Valor de contador', false, 2),
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'subtypes', 'array', 'Subtipos de la carta', false, 3),
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'is_leader', 'boolean', 'Si es una carta de Líder', false, 4)
ON CONFLICT (game_id, attribute_name) DO NOTHING;

-- 5. Insertar tipos de cartas por TCG
INSERT INTO card_types (game_id, type_name, type_category, description, sort_order) VALUES
-- Magic: The Gathering
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Creature', 'main', 'Criaturas que atacan y bloquean', 1),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Instant', 'main', 'Hechizos de velocidad instantánea', 2),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Sorcery', 'main', 'Hechizos de velocidad de conjuro', 3),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Land', 'main', 'Tierras que generan maná', 4),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Artifact', 'main', 'Artefactos y objetos', 5),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Enchantment', 'main', 'Encantamientos continuos', 6),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Planeswalker', 'main', 'Planeswalkers con lealtad', 7),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Battle', 'main', 'Batallas con defensa', 8),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Legendary', 'supertype', 'Supertipo legendario', 9),

-- Pokémon
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Pokémon', 'main', 'Criaturas Pokémon', 1),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Trainer', 'main', 'Cartas de Entrenador', 2),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Energy', 'main', 'Cartas de Energía', 3),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Basic', 'subtype', 'Pokémon básico', 4),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Stage 1', 'subtype', 'Evolución Fase 1', 5),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Stage 2', 'subtype', 'Evolución Fase 2', 6),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'V', 'subtype', 'Pokémon V', 7),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'VMAX', 'subtype', 'Pokémon VMAX', 8),

-- Lorcana
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Character', 'main', 'Personajes de Disney', 1),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Action', 'main', 'Acciones de un solo uso', 2),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Song', 'main', 'Canciones con efectos', 3),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Floodborn', 'subtype', 'Personajes Floodborn', 4),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Hero', 'subtype', 'Personajes héroes', 5),

-- Flesh and Blood
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'Hero', 'main', 'Héroes del juego', 1),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'Weapon', 'main', 'Armas equipables', 2),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'Equipment', 'main', 'Equipamiento', 3),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'Action', 'main', 'Acciones de ataque', 4),
((SELECT game_id FROM games WHERE game_code = 'FAB'), 'Reaction', 'main', 'Reacciones defensivas', 5),

-- Yu-Gi-Oh!
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Monster', 'main', 'Monstruos', 1),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Spell', 'main', 'Hechizos', 2),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Trap', 'main', 'Trampas', 3),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Effect', 'subtype', 'Monstruos de efecto', 4),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Fusion', 'subtype', 'Monstruos de fusión', 5),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Synchro', 'subtype', 'Monstruos de sincronía', 6),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'XYZ', 'subtype', 'Monstruos XYZ', 7),
((SELECT game_id FROM games WHERE game_code = 'YUGIOH'), 'Link', 'subtype', 'Monstruos de enlace', 8),

-- Wixoss
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'LRIG', 'main', 'LRIGs principales', 1),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'SIGNI', 'main', 'SIGNIs de combate', 2),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'Arts', 'main', 'Artes especiales', 3),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'Spell', 'main', 'Hechizos', 4),
((SELECT game_id FROM games WHERE game_code = 'WIXOSS'), 'PIECE', 'main', 'Piezas especiales', 5),

-- One Piece
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'Leader', 'main', 'Cartas de Líder', 1),
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'Character', 'main', 'Personajes', 2),
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'Event', 'main', 'Eventos', 3),
((SELECT game_id FROM games WHERE game_code = 'ONEPIECE'), 'Stage', 'main', 'Etapas/Ubicaciones', 4)
ON CONFLICT (game_id, type_name) DO NOTHING;

-- 6. Insertar sets de ejemplo para Magic: The Gathering
INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, is_promo, total_cards, printed_total) VALUES
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander 2021', 'c21', '2021-04-23', false, false, 97, 97),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander 2022', 'c22', '2022-06-10', false, false, 97, 97),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander 2023', 'c23', '2023-08-04', false, false, 97, 97),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Commander Masters', 'cmm', '2023-08-04', false, false, 100, 100),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'The Lost Caverns of Ixalan', 'lci', '2023-11-17', false, false, 285, 285),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Murders at Karlov Manor', 'mkm', '2024-02-09', false, false, 285, 285)
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 7. Insertar sets de ejemplo para Pokémon
INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, is_promo, total_cards, printed_total) VALUES
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Base Set', 'base1', '1999-01-09', false, false, 102, 102),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Jungle', 'base2', '1999-06-16', false, false, 64, 64),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Fossil', 'base3', '1999-10-10', false, false, 62, 62),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Scarlet & Violet', 'sv1', '2023-03-31', false, false, 198, 198),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Scarlet & Violet—Paldea Evolved', 'sv2', '2023-06-09', false, false, 193, 193),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Scarlet & Violet—Obsidian Flames', 'sv3', '2023-08-11', false, false, 197, 197)
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 8. Insertar sets de ejemplo para Lorcana
INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, is_promo, total_cards, printed_total) VALUES
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'The First Chapter', 'tfc', '2023-08-18', false, false, 204, 204),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Rise of the Floodborn', 'rotf', '2023-11-17', false, false, 204, 204),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Into the Inklands', 'iti', '2024-02-23', false, false, 204, 204)
ON CONFLICT (game_id, set_code) DO NOTHING;

-- 9. Insertar cartas de ejemplo para Magic: The Gathering con atributos específicos
INSERT INTO cards (game_id, card_name, type_line, oracle_text, mana_cost, power, toughness, base_rarity, tcg_specific_attributes) VALUES
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Sol Ring', 'Artifact', '{T}: Add {C}{C}.', '{1}', NULL, NULL, 'uncommon', '{"illustration_id": "sol-ring-2021"}'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Arcane Signet', 'Artifact', '{T}: Add one mana of any color in your commander''s color identity.', '{2}', NULL, NULL, 'common', '{"illustration_id": "arcane-signet-2021"}'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Command Tower', 'Land', '{T}: Add one mana of any color in your commander''s color identity.', NULL, NULL, NULL, 'common', '{"illustration_id": "command-tower-2021"}'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Counterspell', 'Instant', 'Counter target spell.', '{U}{U}', NULL, NULL, 'common', '{"illustration_id": "counterspell-2021"}'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Lightning Bolt', 'Instant', 'Lightning Bolt deals 3 damage to any target.', '{R}', NULL, NULL, 'common', '{"illustration_id": "lightning-bolt-2021"}'),
((SELECT game_id FROM games WHERE game_code = 'MTG'), 'Jace, the Mind Sculptor', 'Legendary Planeswalker — Jace', '+2: Look at the top card of target player''s library. You may put that card on the bottom of that player''s library.\n0: Draw three cards, then put two cards from your hand on top of your library in any order.\n−1: Return target creature to its owner''s hand.\n−12: Exile all cards from target player''s library, then that player shuffles their hand into their library.', '{2}{U}{U}', NULL, NULL, 'mythic', '{"loyalty": "3", "illustration_id": "jace-mind-sculptor-2021"}')
ON CONFLICT (game_id, card_name) DO NOTHING;

-- 10. Insertar cartas de ejemplo para Pokémon con atributos específicos
INSERT INTO cards (game_id, card_name, type_line, oracle_text, mana_cost, hp, base_rarity, tcg_specific_attributes) VALUES
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Charizard', 'Pokémon', 'Fire Spin: Discard 2 Energy cards attached to Charizard in order to use this attack.', NULL, '120', 'holographic', '{"evolves_from": "Charmeleon", "weaknesses": [{"type": "Water", "value": "x2"}], "resistances": [{"type": "Fighting", "value": "-30"}], "retreat_cost": ["Colorless", "Colorless"], "attacks": [{"name": "Fire Spin", "cost": ["Fire", "Fire", "Fire"], "damage": "100"}]}'),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Pikachu', 'Pokémon', 'Thunder Shock: Flip a coin. If heads, the Defending Pokémon is now Paralyzed.', NULL, '60', 'common', '{"weaknesses": [{"type": "Fighting", "value": "x2"}], "resistances": [{"type": "Metal", "value": "-20"}], "retreat_cost": ["Colorless"], "attacks": [{"name": "Thunder Shock", "cost": ["Lightning"], "damage": "20"}]}'),
((SELECT game_id FROM games WHERE game_code = 'POKEMON'), 'Blastoise', 'Pokémon', 'Hydro Pump: Does 40 damage plus 10 more damage for each Water Energy attached to Blastoise but not used to pay for this attack.', NULL, '100', 'holographic', '{"evolves_from": "Wartortle", "weaknesses": [{"type": "Lightning", "value": "x2"}], "resistances": [], "retreat_cost": ["Colorless", "Colorless"], "attacks": [{"name": "Hydro Pump", "cost": ["Water", "Water", "Water"], "damage": "40+"}]}')
ON CONFLICT (game_id, card_name) DO NOTHING;

-- 11. Insertar cartas de ejemplo para Lorcana con atributos específicos
INSERT INTO cards (game_id, card_name, type_line, oracle_text, mana_cost, base_rarity, tcg_specific_attributes) VALUES
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Elsa - Spirit of Winter', 'Character', 'Frozen Heart: When this character enters play, choose an opposing character. That character can''t ready during their next ready step.', '{5}', 'legendary', '{"ink_color": "Amber", "inkwell": true, "classifications": ["Floodborn", "Hero"], "strength": 4, "willpower": 5, "lore": 2}'),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Mickey Mouse - Brave Little Tailor', 'Character', 'Brave Little Tailor: When this character enters play, you may put a +1/+1 counter on another character you control.', '{3}', 'rare', '{"ink_color": "Amber", "inkwell": true, "classifications": ["Hero"], "strength": 3, "willpower": 3, "lore": 1}'),
((SELECT game_id FROM games WHERE game_code = 'LORCANA'), 'Maleficent - Dragon Form', 'Character', 'Dragon Form: When this character enters play, you may put a +1/+1 counter on another character you control.', '{7}', 'legendary', '{"ink_color": "Amethyst", "inkwell": false, "classifications": ["Floodborn"], "strength": 7, "willpower": 7, "lore": 3}')
ON CONFLICT (game_id, card_name) DO NOTHING;

-- 12. Insertar impresiones de ejemplo con atributos específicos
INSERT INTO card_printings (card_id, set_id, collector_number, rarity, is_foil, is_non_foil, artist, image_url_small, image_url_normal, image_url_large, tcg_specific_printing_attributes) VALUES
-- Sol Ring de Commander 2021
((SELECT card_id FROM cards WHERE card_name = 'Sol Ring' AND game_id = (SELECT game_id FROM games WHERE game_code = 'MTG')), 
 (SELECT set_id FROM sets WHERE set_code = 'c21' AND game_id = (SELECT game_id FROM games WHERE game_code = 'MTG')), 
 '127', 'uncommon', false, true, 'Volkan Baga', 
 'https://cards.scryfall.io/small/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg',
 'https://cards.scryfall.io/normal/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg',
 'https://cards.scryfall.io/large/front/b/3/b30d345c-dc99-42be-98fb-42045c9b74e8.jpg',
 '{"frame_effects": ["showcase"], "border_color": "black"}'),

-- Charizard de Base Set
((SELECT card_id FROM cards WHERE card_name = 'Charizard' AND game_id = (SELECT game_id FROM games WHERE game_code = 'POKEMON')), 
 (SELECT set_id FROM sets WHERE set_code = 'base1' AND game_id = (SELECT game_id FROM games WHERE game_code = 'POKEMON')), 
 '4', 'holographic', false, true, 'Mitsuhiro Arita',
 'https://images.pokemontcg.io/base1/4.png',
 'https://images.pokemontcg.io/base1/4.png',
 'https://images.pokemontcg.io/base1/4_hires.png',
 '{"is_first_edition": false, "is_full_art": false}'),

-- Elsa de The First Chapter
((SELECT card_id FROM cards WHERE card_name = 'Elsa - Spirit of Winter' AND game_id = (SELECT game_id FROM games WHERE game_code = 'LORCANA')), 
 (SELECT set_id FROM sets WHERE set_code = 'tfc' AND game_id = (SELECT game_id FROM games WHERE game_code = 'LORCANA')), 
 '172', 'legendary', false, true, 'Disney',
 'https://example.com/elsa-small.jpg',
 'https://example.com/elsa-normal.jpg',
 'https://example.com/elsa-large.jpg',
 '{"is_enchanted": true, "is_full_art": true}')
ON CONFLICT (set_id, collector_number, is_foil, is_etched) DO NOTHING;

-- 13. Insertar precios de ejemplo (datos históricos simulados)
INSERT INTO price_history (printing_id, source_id, condition_id, price_usd, price_eur, stock_quantity, timestamp, price_type, is_foil, is_etched) VALUES
-- Sol Ring NM en TCGplayer
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Sol Ring' AND s.set_code = 'c21' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'TCGPLAYER'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 1.25, 1.15, 50, NOW() - INTERVAL '1 day', 'market', false, false),

-- Sol Ring NM en Card Kingdom
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Sol Ring' AND s.set_code = 'c21' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'CARDKINGDOM'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 1.50, 1.40, 25, NOW() - INTERVAL '1 day', 'market', false, false),

-- Charizard NM en TCGplayer
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Charizard' AND s.set_code = 'base1' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'TCGPLAYER'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 350.00, 320.00, 5, NOW() - INTERVAL '1 day', 'market', false, false),

-- Elsa NM en TCGplayer
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Elsa - Spirit of Winter' AND s.set_code = 'tfc' AND cp.is_foil = false), 
 (SELECT source_id FROM sources WHERE source_code = 'TCGPLAYER'),
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 45.50, 42.00, 15, NOW() - INTERVAL '1 day', 'market', false, false)
ON CONFLICT (printing_id, source_id, condition_id, price_type, is_foil, is_etched, date_only) DO NOTHING;

-- 14. Calcular precios agregados iniciales
INSERT INTO aggregated_prices (printing_id, condition_id, avg_market_price_usd, avg_market_price_eur, buy_price_usd, buy_price_eur, low_price_usd, low_price_eur, high_price_usd, high_price_eur, price_count, last_updated) VALUES
-- Sol Ring NM
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Sol Ring' AND s.set_code = 'c21' AND cp.is_foil = false), 
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 1.38, 1.28, 0.83, 0.77, 1.25, 1.15, 1.50, 1.40, 2, NOW()),

-- Charizard NM
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Charizard' AND s.set_code = 'base1' AND cp.is_foil = false), 
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 350.00, 320.00, 210.00, 192.00, 350.00, 320.00, 350.00, 320.00, 1, NOW()),

-- Elsa NM
((SELECT printing_id FROM card_printings cp 
  JOIN cards c ON cp.card_id = c.card_id 
  JOIN sets s ON cp.set_id = s.set_id 
  WHERE c.card_name = 'Elsa - Spirit of Winter' AND s.set_code = 'tfc' AND cp.is_foil = false), 
 (SELECT condition_id FROM conditions WHERE condition_code = 'NM'),
 45.50, 42.00, 27.30, 25.20, 45.50, 42.00, 45.50, 42.00, 1, NOW())
ON CONFLICT (printing_id, condition_id) DO UPDATE SET
    avg_market_price_usd = EXCLUDED.avg_market_price_usd,
    avg_market_price_eur = EXCLUDED.avg_market_price_eur,
    buy_price_usd = EXCLUDED.buy_price_usd,
    buy_price_eur = EXCLUDED.buy_price_eur,
    low_price_usd = EXCLUDED.low_price_usd,
    low_price_eur = EXCLUDED.low_price_eur,
    high_price_usd = EXCLUDED.high_price_usd,
    high_price_eur = EXCLUDED.high_price_eur,
    price_count = EXCLUDED.price_count,
    last_updated = EXCLUDED.last_updated;

-- Comentarios para documentación
COMMENT ON TABLE games IS 'Datos iniciales: Juegos soportados por la plataforma con descripciones';
COMMENT ON TABLE conditions IS 'Datos iniciales: Condiciones estándar de las cartas con descripciones';
COMMENT ON TABLE sources IS 'Datos iniciales: Fuentes de precios principales con configuración de API';
COMMENT ON TABLE card_attributes IS 'Datos iniciales: Atributos específicos por TCG para consultas optimizadas';
COMMENT ON TABLE card_types IS 'Datos iniciales: Tipos de cartas específicos por TCG';
COMMENT ON TABLE sets IS 'Datos iniciales: Sets de ejemplo para cada juego con información completa';
COMMENT ON TABLE cards IS 'Datos iniciales: Cartas de ejemplo con atributos específicos por TCG';
COMMENT ON TABLE card_printings IS 'Datos iniciales: Impresiones de ejemplo con atributos específicos';
COMMENT ON TABLE price_history IS 'Datos iniciales: Precios históricos simulados con granularidad completa';
COMMENT ON TABLE aggregated_prices IS 'Datos iniciales: Precios agregados calculados con rangos'; 