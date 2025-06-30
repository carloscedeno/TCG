-- 008_extend_cards_and_printings_for_scryfall.sql
-- Extiende las tablas 'cards' y 'card_printings' para soportar todos los campos relevantes de Scryfall (MTG)
-- Incluye arrays, jsonb, y soporte para cartas de dos caras (card_faces)
-- Todas las operaciones son idempotentes

-- ===== CARDS =====
DO $$ BEGIN
    -- CMC (converted mana cost)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='cmc') THEN
        ALTER TABLE cards ADD COLUMN cmc NUMERIC;
    END IF;
    -- colors (array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='colors') THEN
        ALTER TABLE cards ADD COLUMN colors TEXT[];
    END IF;
    -- color_identity (array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='color_identity') THEN
        ALTER TABLE cards ADD COLUMN color_identity TEXT[];
    END IF;
    -- layout
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='layout') THEN
        ALTER TABLE cards ADD COLUMN layout TEXT;
    END IF;
    -- edhrec_rank
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='edhrec_rank') THEN
        ALTER TABLE cards ADD COLUMN edhrec_rank INTEGER;
    END IF;
    -- legalities (jsonb)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cards' AND column_name='legalities') THEN
        ALTER TABLE cards ADD COLUMN legalities JSONB;
    END IF;
END $$;

-- ===== CARD_PRINTINGS =====
DO $$ BEGIN
    -- set_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='set_code') THEN
        ALTER TABLE card_printings ADD COLUMN set_code TEXT;
    END IF;
    -- image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='image_url') THEN
        ALTER TABLE card_printings ADD COLUMN image_url TEXT;
    END IF;
    -- released_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='released_at') THEN
        ALTER TABLE card_printings ADD COLUMN released_at DATE;
    END IF;
    -- is_foil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='is_foil') THEN
        ALTER TABLE card_printings ADD COLUMN is_foil BOOLEAN;
    END IF;
    -- is_nonfoil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='is_nonfoil') THEN
        ALTER TABLE card_printings ADD COLUMN is_nonfoil BOOLEAN;
    END IF;
    -- is_promo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='is_promo') THEN
        ALTER TABLE card_printings ADD COLUMN is_promo BOOLEAN;
    END IF;
    -- is_reprint
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='is_reprint') THEN
        ALTER TABLE card_printings ADD COLUMN is_reprint BOOLEAN;
    END IF;
    -- prices (jsonb)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='prices') THEN
        ALTER TABLE card_printings ADD COLUMN prices JSONB;
    END IF;
    -- related_uris (jsonb)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='related_uris') THEN
        ALTER TABLE card_printings ADD COLUMN related_uris JSONB;
    END IF;
    -- all_parts (jsonb)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='all_parts') THEN
        ALTER TABLE card_printings ADD COLUMN all_parts JSONB;
    END IF;
    -- card_faces (jsonb)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='card_printings' AND column_name='card_faces') THEN
        ALTER TABLE card_printings ADD COLUMN card_faces JSONB;
    END IF;
END $$; 