-- This file is generated to be executed via Supabase execute_sql tool
-- Step 1: Create essential tables (Schema Reconstruction)

CREATE TABLE IF NOT EXISTS public.games (
    game_id SERIAL PRIMARY KEY,
    game_name TEXT NOT NULL,
    game_code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sources (
    source_id SERIAL PRIMARY KEY,
    source_name TEXT NOT NULL,
    source_code TEXT NOT NULL UNIQUE,
    website_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    api_endpoint TEXT,
    api_key_required BOOLEAN DEFAULT false,
    rate_limit_per_minute INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conditions (
    condition_id SERIAL PRIMARY KEY,
    condition_name TEXT NOT NULL,
    condition_code TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cards (
    card_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id INTEGER REFERENCES public.games(game_id),
    card_name TEXT NOT NULL,
    type_line TEXT,
    oracle_text TEXT,
    mana_cost TEXT,
    power TEXT,
    toughness TEXT,
    base_rarity TEXT,
    api_source_id TEXT,
    tcg_specific_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sets (
    set_id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES public.games(game_id),
    set_name TEXT NOT NULL,
    set_code TEXT NOT NULL UNIQUE,
    release_date DATE,
    is_digital BOOLEAN DEFAULT false,
    total_cards INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.card_printings (
    printing_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(card_id) ON DELETE CASCADE,
    set_id INTEGER REFERENCES public.sets(set_id),
    collector_number TEXT,
    rarity TEXT,
    is_foil BOOLEAN DEFAULT false,
    image_url_small TEXT,
    image_url_normal TEXT,
    image_url_large TEXT,
    set_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    printing_id UUID NOT NULL REFERENCES public.card_printings(printing_id) ON DELETE CASCADE,
    name TEXT,
    game TEXT,
    set_code TEXT,
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    condition TEXT DEFAULT 'NM',
    finish TEXT DEFAULT 'nonfoil',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed data for master tables (Small enough for fixed SQL)
INSERT INTO public.games (game_name, game_code) VALUES 
('Magic: The Gathering', 'MTG'),
('Pokémon TCG', 'PTCG'),
('Yu-Gi-Oh!', 'YGO'),
('Disney Lorcana', 'LOR'),
('One Piece TCG', 'OP'),
('Star Wars: Unlimited', 'SWU'),
('Dragon Ball Super', 'DBS')
ON CONFLICT DO NOTHING;

INSERT INTO public.conditions (condition_name, condition_code, sort_order) VALUES 
('Near Mint', 'NM', 1),
('Lightly Played', 'LP', 2),
('Moderately Played', 'MP', 3),
('Heavily Played', 'HP', 4),
('Damaged', 'DMG', 5)
ON CONFLICT DO NOTHING;
