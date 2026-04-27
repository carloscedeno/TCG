-- =============================================================================
-- ACTIVA_MVP_FINAL (Master One-Shot Script)
-- =============================================================================

BEGIN;

-- 1. LIMPIEZA DE BASURA (Asegurar que no haya huérfanos)
DELETE FROM public.products WHERE id IN (SELECT id FROM public.products WHERE printing_id::text LIKE '0000%');
DELETE FROM public.card_printings WHERE printing_id::text LIKE '0000%';
DELETE FROM public.cards WHERE card_id::text LIKE '0000%';

-- 2. DATOS MAESTROS (Games & Sets)
INSERT INTO public.games (game_name, game_code) VALUES 
('Magic: The Gathering', 'MTG'),
('Pokémon TCG', 'POKEMON')
ON CONFLICT (game_code) DO NOTHING;

INSERT INTO public.sets (game_id, set_name, set_code, release_date) 
SELECT game_id, 'Urza''s Legacy', 'ULG', '1999-02-15' FROM public.games WHERE game_code = 'MTG'
UNION ALL
SELECT game_id, 'Revised Edition', '3ED', '1994-04-01' FROM public.games WHERE game_code = 'MTG'
ON CONFLICT (set_code) DO NOTHING;

-- 3. CATÁLOGO PILOTO (Cards -> Printings -> Products)
INSERT INTO public.cards (card_id, card_name, game_id, rarity, type_line)
VALUES 
  ('00000000-0000-0000-0000-000000002001', 'Grim Monolith', (SELECT game_id FROM public.games WHERE game_code = 'MTG'), 'Rare', 'Artifact'),
  ('00000000-0000-0000-0000-000000002002', 'Savannah', (SELECT game_id FROM public.games WHERE game_code = 'MTG'), 'Rare', 'Land')
ON CONFLICT (card_id) DO NOTHING;

INSERT INTO public.card_printings (printing_id, card_id, set_id, set_code, image_url, image_url_normal, rarity, lang)
VALUES 
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000002001', (SELECT set_id FROM public.sets WHERE set_code = 'ULG'), 'ULG', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/card-images/fallback-card.jpg', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/card-images/fallback-card.jpg', 'Rare', 'en'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000002002', (SELECT set_id FROM public.sets WHERE set_code = '3ED'), '3ED', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/card-images/fallback-card.jpg', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/card-images/fallback-card.jpg', 'Rare', 'en')
ON CONFLICT (printing_id) DO NOTHING;

INSERT INTO public.products (name, condition, price, stock, set_code, image_url, printing_id, finish)
VALUES 
  ('Grim Monolith', 'Near Mint', 350.00, 10, 'ULG', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/card-images/fallback-card.jpg', '00000000-0000-0000-0000-000000001001', 'nonfoil'),
  ('Savannah', 'Excellent', 420.00, 5, '3ED', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/card-images/fallback-card.jpg', '00000000-0000-0000-0000-000000001002', 'nonfoil')
ON CONFLICT (printing_id, condition, finish) DO NOTHING;

-- 4. BANNERS
INSERT INTO public.hero_banners (title, subtitle, image_url, link_url, category, sort_order)
VALUES 
  ('Nuevas Sleeves Dragon Shield', 'La mejor protección para tus cartas favoritas.', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/public_assets/banners/accessories_banner.jpg', '/marketplace?category=sleeves', 'main_hero', 1),
  ('Reserva Modern Horizons 3', 'No te quedes sin tu caja del set más esperado.', 'https://mgiihstfbeidvdypsszu.supabase.co/storage/v1/object/public/public_assets/banners/mh3_banner.jpg', '/marketplace?set=MH3', 'main_hero', 2)
ON CONFLICT DO NOTHING;

-- 5. REFRESCAR MOTOR (Vista Materializada)
-- Usamos LEFT JOIN para que nada se oculte por falta de metadatos
DROP MATERIALIZED VIEW IF EXISTS public.mv_unique_cards CASCADE;

CREATE MATERIALIZED VIEW public.mv_unique_cards AS
SELECT DISTINCT ON (c.card_name)
    cp.printing_id,
    c.card_id,
    c.card_name::TEXT,
    COALESCE(cp.image_url, cp.image_url_normal)::TEXT as image_url,
    s.set_name::TEXT,
    s.set_code::TEXT,
    COALESCE(c.rarity, cp.rarity)::TEXT as rarity,
    c.type_line::TEXT,
    c.colors,
    s.release_date,
    cp.avg_market_price_usd,
    cp.avg_market_price_foil_usd,
    p.price as store_price,
    c.game_id,
    c.cmc,
    cp.lang
FROM public.card_printings cp
LEFT JOIN public.cards c ON cp.card_id = c.card_id
LEFT JOIN public.sets s ON cp.set_id = s.set_id
LEFT JOIN public.products p ON cp.printing_id = p.printing_id
WHERE (cp.lang = 'en' OR cp.lang IS NULL OR cp.lang = '')
ORDER BY 
    c.card_name,
    s.release_date DESC NULLS LAST;

CREATE INDEX idx_mv_unique_cards_name ON public.mv_unique_cards(card_name);
CREATE INDEX idx_mv_unique_cards_trgm ON public.mv_unique_cards USING gin (card_name gin_trgm_ops);

-- 6. ADMINISTRADOR
INSERT INTO public.profiles (id, role)
VALUES ((SELECT id FROM auth.users WHERE email = 'admin@geeko.com'), 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

COMMIT;

-- Actualización final fuera de la transacción para asegurar visibilidad
REFRESH MATERIALIZED VIEW public.mv_unique_cards;
