-- Bulk Import from CSV (Dynamic Game Mapping)
BEGIN;

INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('gundam card game: phantom aria booster [gd04]', '', 6.71, 5.16, 6.71, 18, 'GUNDAM', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('gundam card game: phantom aria booster pack display [gd04] caja', '', 101.35, 77.96, 101.35, 12, 'GUNDAM', NULL, 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('digimon tcg: booster [ad-01]', '', 8.11, 6.24, 8.11, 7, 'Digimon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Digimon Card Game%' OR game_code ILIKE 'Digimon Card Game%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: play booter perfect order', '', 4.45, 3.42, 4.45, 2, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: mega evolution 03 perfect order- elite trainer box spanish', '', 53.76, 41.35, 53.76, 14, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('digimon tcg: advance booster digimon generation [ad-01] caja', '', 68.69, 52.84, 68.69, 2, 'DIGIMON', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Digimon Card Game%' OR game_code ILIKE 'Digimon Card Game%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('palitos', '', 1.30, 1.00, 1.30, 9, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('refresco retornable', '', 0.56, 0.43, 0.56, 64, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('yuca iselitas limon', '', 2.60, 2.00, 2.60, 3, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secrets of strixhaven play booster display', '', 4.97, 3.82, 4.97, 10, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flaquito chocolate', '', 0.92, 0.71, 0.92, 5, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('bombombun variada', '', 0.13, 0.10, 0.13, 10, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('chocolate cricri', '', 1.69, 1.30, 1.69, 20, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('chocolate savoy', '', 1.69, 1.30, 1.69, 20, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('caramelos chao nuevos', '', 0.16, 0.12, 0.16, 1, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('chicle buzzi hotwheels', '', 0.04, 0.03, 0.04, 49, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('samba de chocolate', '', 1.23, 0.95, 1.23, 12, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('samba de fresa', '', 1.23, 0.95, 1.23, 4, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('piruetas display', '', 0.47, 0.36, 0.47, 9, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('cocosette', '', 1.34, 1.03, 1.34, 16, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mentos', '', 0.64, 0.49, 0.64, 8, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('chupeta pin pop surtida', '', 0.20, 0.15, 0.20, 12, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flaquito nevado', '', 0.92, 0.71, 0.92, 2, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('polvorones', '', 1.05, 0.81, 1.05, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('detodito familiar', '', 3.64, 2.80, 3.64, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('betogalletas especiales', '', 5.20, 4.00, 5.20, 1, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('panque jeancake', '', 1.51, 1.17, 1.51, 14, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('yuca iselitas natural', '', 2.60, 2.00, 2.60, 6, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('yuca iselitas crema de cebolla', '', 2.34, 1.80, 2.34, 3, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('raquety mediano picante', '', 1.17, 0.90, 1.17, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('tom mediano', '', 2.34, 1.80, 2.34, 1, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dorito flamingo hot', '', 4.23, 3.25, 4.23, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dorito familiar', '', 4.23, 3.25, 4.23, 4, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('agua gasificada', '', 1.46, 1.12, 1.46, 23, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('gatorade tropical', '', 2.17, 1.67, 2.17, 16, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('gatorade mora', '', 2.17, 1.67, 2.17, 7, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('gatorade mandarina', '', 2.17, 1.67, 2.17, 13, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('lipton limon', '', 2.14, 1.65, 2.14, 10, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('lipton durazno', '', 2.14, 1.65, 2.14, 18, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('malta retornable', '', 0.60, 0.46, 0.60, 80, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secret lair drop- uncharted: saga of thieves- regular', '', 43.91, 33.78, 43.91, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed play booster display', '', 4.99, 3.84, 4.99, 39, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('(preventa) mtg: secrets of strixhaven commander deck - silverquill influence', '', 41.41, 31.85, 41.41, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('(preventa) mtg: secrets of strixhaven play booster display', '', 127.08, 97.75, 127.08, 28, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: spanish universes beyond- teenage mutant ninja turtles prerelease pack (SPANISH)', '', 37.93, 29.18, 37.93, 38, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed preconstructed angels', '', 20.01, 15.39, 20.01, 8, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed collector''s booster display', '', 23.41, 18.01, 23.41, 6, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secrets of strixhaven play booster display (caja)', '', 148.82, 114.48, 148.82, 4, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('(preventa) mtg: secrets of strixhaven bundle', '', 59.29, 45.61, 59.29, 18, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('(Preventa) mtg: secrets of strixhaven codex bundle', '', 83.01, 63.85, 83.01, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed collector''s booster display caja', '', 280.97, 216.13, 280.97, 3, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('one piece tcg: double pack set (dp-10)', '', 13.68, 10.52, 13.68, 13, 'ONE PIECE', (SELECT game_id FROM public.games WHERE game_name ILIKE 'One Piece Card Game%' OR game_code ILIKE 'One Piece Card Game%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('one piece tcg: japanese 3rd anniversary set', '', 185.06, 142.35, 185.06, 0, 'ONE PIECE', (SELECT game_id FROM public.games WHERE game_name ILIKE 'One Piece Card Game%' OR game_code ILIKE 'One Piece Card Game%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- teenage mutant ninja turtles bundle', '', 79.70, 61.31, 79.70, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('(Preventa) mtg: secrets of strixhaven commander deck - quandrix unlimited', '', 46.63, 35.87, 46.63, 2, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: spanish secrets of strixhaven prerelease pack', '', 33.93, 26.10, 33.93, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed preconstructed pirats', '', 20.01, 15.39, 20.01, 6, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- teenage mutant ninja turtles commander deck display', '', 57.28, 44.06, 57.28, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secrets of strixhaven collector''s booster display', '', 278.84, 214.49, 278.84, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond-teenage mutant ninja turtles play booster', '', 5.89, 4.53, 5.89, 8, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- teenage mutant ninja turtles draft night box', '', 123.68, 95.14, 123.68, 4, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- avatar the last airbender play booster', '', 5.82, 4.48, 5.82, 32, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secrets of strixhaven commander deck - prismari artistry', '', 43.03, 33.10, 43.03, 2, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('gomitas trululu', '', 1.56, 1.20, 1.56, 7, 'consumible', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('one piece tcg: official sleeves tcg+ stores limited edition vol. 6 lilith display', '', 10.22, 7.86, 10.22, 12, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d icons of the realms: ghost light - booster brick (10 boosters)', '', 31.97, 24.59, 31.97, 10, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('perler beads abalorios small', '', 13.00, 10.00, 13.00, 4, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('digimon tcg: limited card pack- another knight- [ lm-07] CAJA', '', 30.82, 23.71, 30.82, 22, 'DIGIMON', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Digimon Card Game%' OR game_code ILIKE 'Digimon Card Game%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: mega evolution 02.5 ascended heroes- first partners deluxe pin collection ', '', 25.17, 19.36, 25.17, 1, 'POKEMON', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('digimon tcg: tamer''s evolution box -rise of digimon- (pb-21)', '', 212.76, 163.66, 212.76, 2, 'Digimon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Digimon Card Game%' OR game_code ILIKE 'Digimon Card Game%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flesh and blood tcg: compendium of rathe booster display', '', 4.80, 3.69, 4.80, 9, 'Flesh and Blood', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Flesh and Blood%' OR game_code ILIKE 'Flesh and Blood%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: spanish team rocket''s mewtwo ex league battle deck case', '', 36.08, 27.75, 36.08, 1, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: team rocket''s mewtwo ex league battle deck case', '', 36.08, 27.75, 36.08, 10, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: trainer''s toolkit 2025', '', 39.78, 30.60, 39.78, 1, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('(preventa) riftbound tcg: set 3- unleashed- booster display', '', 101.20, 77.85, 101.20, 0, 'Riftbound', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('one piece tcg: adventure on kami''s island booster display (op-15) CAJA', '', 101.35, 77.96, 101.35, 1, 'ONE PIECE', (SELECT game_id FROM public.games WHERE game_name ILIKE 'One Piece Card Game%' OR game_code ILIKE 'One Piece Card Game%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('agua minalba', '', 1.07, 0.82, 1.07, 31, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('betogalletas', '', 3.90, 3.00, 3.90, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond-teenage mutant ninja turtles play booster (caja)', '', 176.59, 135.84, 176.59, 4, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('ultimate guard 9-pocket pages 100ct unidad', '', 0.53, 0.41, 0.53, 58, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('canelita', '', 0.98, 0.75, 0.98, 1, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('stranger things treasure packs pdq', '', 11.15, 8.58, 11.15, 10, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('baldur''s gate 3 treasure pack dice set pdq (25 sets)', '', 10.05, 7.73, 10.05, 3, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('ruffles familiar natural', '', 4.55, 3.50, 4.55, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('ruffles familiar queso', '', 5.07, 3.90, 5.07, 4, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('"yu-gi-oh! tcg ""justice hunters"" booster display"', '', 3.50, 2.69, 3.50, 0, 'Yu-Gi-Oh', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Yu-Gi-Oh!%' OR game_code ILIKE 'Yu-Gi-Oh!%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- avatar the last airbender collector''s booster', '', 32.41, 24.93, 32.41, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('binder: 4-pocket domaru cryptids collection', '', 33.29, 25.61, 33.29, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('reven binders', '', 32.50, 25.00, 32.50, 1, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('weiss schwarz: hatsune miku colorful stage! leo/need trial deck', '', 22.13, 17.02, 22.13, 0, 'Weiss Schwarz:', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Weiss Schwarz%' OR game_code ILIKE 'Weiss Schwarz%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('binder: 9-pocket domaru cryptids collection', '', 44.97, 34.59, 44.97, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secrets of strixhaven commander deck - silverquill influence', '', 43.03, 33.10, 43.03, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- avatar the last airbender bundle', '', 65.99, 50.76, 65.99, 0, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('raquety mediano queso', '', 1.17, 0.90, 1.17, 7, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyondteenage mutant ninja turtles collector''s booster display', '', 35.63, 27.41, 35.63, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond teenage mutant ninja turtles pizza bundle', '', 93.81, 72.16, 93.81, 0, 'MAGIC', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('digimon tcg: limited card pack- another knight- [ lm-07] booster', '', 5.14, 3.95, 5.14, 13, 'DIGIMON', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Digimon Card Game%' OR game_code ILIKE 'Digimon Card Game%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('minipiruetas', '', 2.24, 1.72, 2.24, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('sha chicle acido', '', 0.09, 0.07, 0.09, 32, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('playmat: extended- doom', '', 30.73, 23.64, 30.73, 4, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flesh & blood tcg: silver age chapter 2 deck display', '', 16.96, 13.05, 16.96, 1, 'Flesh and Blood', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Flesh and Blood%' OR game_code ILIKE 'Flesh and Blood%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('cheesetris familiar', '', 2.60, 2.00, 2.60, 2, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('sobres album de marvel panini', '', 2.60, 2.00, 2.60, 48, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('panini tcg adrenalyn play booster', '', 4.68, 3.60, 4.68, 4, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('lokino de barra surtido', '', 0.10, 0.08, 0.10, 5, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('panini tcg adrenalyn play booster caja', '', 112.32, 86.40, 112.32, 1, 'Concesión', NULL, 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('album marvel panini', '', 7.80, 6.00, 7.80, 3, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('7-die set d&d dragon scale: metal- gold', '', 43.15, 33.19, 43.15, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyondteenage mutant ninja turtles collector''s booster display caja', '', 427.60, 328.92, 427.60, 3, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed play booster display caja', '', 149.84, 115.26, 149.84, 3, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: spanish lorwyn eclipsed prerelease pack (SPANISH)', '', 34.53, 26.56, 34.53, 9, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: lorwyn eclipsed commander deck display', '', 43.32, 33.32, 43.32, 6, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flesh and blood tcg: compendium of rathe booster display caja', '', 115.21, 88.62, 115.21, 2, 'Flesh and Blood', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Flesh and Blood%' OR game_code ILIKE 'Flesh and Blood%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('perler beads abalorios xl', '', 26.00, 20.00, 26.00, 4, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- avatar the last airbender play booster display caja', '', 174.68, 134.37, 174.68, 2, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('riftbound tcg: set 2-spiritforged- booster display caja', '', 106.08, 81.60, 106.08, 0, 'Riftbound', NULL, 'Caja.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('weiss schwarz: hatsune miku colorful stage! vivid bad squad trial deck', '', 22.13, 17.02, 22.13, 1, 'Weiss Schwarz:', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Weiss Schwarz%' OR game_code ILIKE 'Weiss Schwarz%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('"pok�mon tcg: spanish mega evolution 2.5 - ""ascended heroes"" collection - (erika/larry)"', '', 8.71, 6.70, 8.71, 0, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('7-die set mini metal: mystery misfit assortment', '', 19.19, 14.76, 19.19, 4, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('susy', '', 1.34, 1.03, 1.34, 0, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('pokemon tcg: mega evolution 03 perfect order- elite trainer box', '', 92.30, 71.00, 92.30, 0, 'Pokemon', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Pokémon TCG%' OR game_code ILIKE 'Pokémon TCG%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('box of 50(tm) opaque polyhedral dice sets sampler - contains 50 x 7-die set assorted', '', 9.05, 6.96, 9.05, 10, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dice case: d&d premium dice scroll- artifacts across eternities- drizzt & the forgotten realms map', '', 32.90, 25.31, 32.90, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- gondor', '', 33.32, 25.63, 33.32, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- rivendell', '', 33.32, 25.63, 33.32, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flesh and blood tcg: rhinar armory deck [limitations apply]', '', 31.67, 24.36, 31.67, 1, 'Flesh and Blood', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Flesh and Blood%' OR game_code ILIKE 'Flesh and Blood%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('perler beads abalorios medium', '', 19.50, 15.00, 19.50, 6, 'Concesión', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- the shire', '', 33.32, 25.63, 33.32, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- rohan', '', 33.32, 25.63, 33.32, 0, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d nolzur''s marvelous miniatures: unpainted minis- wave 28- satyr & dryad', '', 5.60, 4.31, 5.60, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d nolzur''s marvelous miniatures: unpainted minis- wave 28- swarm of rot grubs & rot grub victim', '', 5.60, 4.31, 5.60, 2, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d nolzur''s marvelous miniatures: unpainted minis- wave 28- drow mage & yochlol', '', 5.60, 4.31, 5.60, 2, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d nolzur''s marvelous miniatures: unpainted minis- wave 28- roc', '', 50.66, 38.97, 50.66, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('flesh and blood tcg: ira armory deck', '', 33.97, 26.13, 33.97, 1, 'Flesh and Blood', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Flesh and Blood%' OR game_code ILIKE 'Flesh and Blood%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('sleeves japones kuriboh', '', 14.30, 11.00, 14.30, 2, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('wixoss legendary diva booster display caja', '', 60.19, 46.30, 60.19, 4, 'Wixoss', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('"yu-gi-oh! tcg ""duelist�s advance"" booster"', '', 3.67, 2.82, 3.67, 19, 'Yu-Gi-Oh', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Yu-Gi-Oh!%' OR game_code ILIKE 'Yu-Gi-Oh!%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('weiss schwarz: hatsune miku colorful stage! more more jump! trial deck', '', 22.13, 17.02, 22.13, 1, 'Weiss Schwarz:', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Weiss Schwarz%' OR game_code ILIKE 'Weiss Schwarz%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('weiss schwarz: hatsune miku colorful stage! wonderlands�showtime trial deck', '', 22.13, 17.02, 22.13, 1, 'Weiss Schwarz:', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Weiss Schwarz%' OR game_code ILIKE 'Weiss Schwarz%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('universes beyond- marvel spider-man bundle', '', 69.89, 53.76, 69.89, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: spanish universes beyond- avatar the last airbender beginner box', '', 52.00, 40.00, 52.00, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secret lair drop- the last of us part ii: path of retribution- regular', '', 43.91, 33.78, 43.91, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- marvel spider-man gift bundle', '', 88.63, 68.18, 88.63, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: universes beyond- avatar the last airbender beginner box', '', 52.92, 40.71, 52.92, 5, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: secret lair drop- the last of us part i: chasing hope- regular', '', 43.88, 33.75, 43.88, 1, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('mtg: .999 silver plated metal card - karn', '', 26.00, 20.00, 26.00, 2, 'Magic', (SELECT game_id FROM public.games WHERE game_name ILIKE 'Magic: The Gathering%' OR game_code ILIKE 'Magic: The Gathering%' LIMIT 1), 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d dungeon master''s screen wilderness kit', '', 28.48, 21.91, 28.48, 2, 'dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d nolzur''s marvelous miniatures: unpainted minis- black dracolich', '', 143.79, 110.61, 143.79, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d icons of the realms: baldur''s gate 3 - character miniaturesboxed set', '', 38.65, 29.73, 38.65, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d 5th edition monster manual - spanish', '', 57.19, 43.99, 57.19, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d, 5e: heroes of faerun', '', 56.80, 43.69, 56.80, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dungeons & dragons - 3.5 edicion - hojas de personaje delux libreta completa', '', 13.01, 10.01, 13.01, 2, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d 5th ed. xanathar''s guide to everything - spanish', '', 46.86, 36.05, 46.86, 2, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dungeons & dragons 5th edition character sheets 2017 - english 24ct. libreta completa', '', 12.09, 9.30, 12.09, 1, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('d&d 5th ed. tasha''s cauldron of everything - spanish', '', 56.11, 43.16, 56.11, 2, 'Dungeons and Dragons', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('bolsa geekorium', '', 0.26, 0.20, 0.26, 123, 'Consumibles', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('playmat: pokemon- stitched abra evolutions', '', 26.38, 20.29, 26.38, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dragon shield sleeves: square (100 ct.)', '', 7.33, 5.64, 7.33, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dragon shield sleeves: oversize (100 ct.)', '', 9.15, 7.04, 9.15, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dragon shield sleeves: extra large (100 ct.)', '', 8.05, 6.19, 8.05, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('dragon shield sleeves: board game sleeves- grand standard (100 ct.)', '', 8.19, 6.30, 8.19, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('deluxe gaming trove- gallery series haunted hollow', '', 56.17, 43.21, 56.17, 1, 'Accesorios', NULL, 'Und.', 'Español', true);
INSERT INTO public.accessories (name, description, price, cost, suggested_price, stock, category, game_id, unit_type, language, is_active) 
VALUES ('deck protectors: apex- doom (105ct)', '', 18.46, 14.20, 18.46, 1, 'Accesorios', NULL, 'Und.', 'Español', true);

COMMIT;