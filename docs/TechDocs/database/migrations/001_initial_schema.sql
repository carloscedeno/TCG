-- Migración inicial: Esquema base de datos robusto para múltiples TCG
-- Fecha: 2025-01-28
-- Descripción: Crear todas las tablas principales del sistema con soporte completo para múltiples TCG

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Juegos
CREATE TABLE games (
    game_id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL UNIQUE,
    game_code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Sets/Ediciones
CREATE TABLE sets (
    set_id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
    set_name VARCHAR(200) NOT NULL,
    set_code VARCHAR(20) NOT NULL,
    release_date DATE,
    is_digital BOOLEAN DEFAULT false,
    is_promo BOOLEAN DEFAULT false,
    total_cards INTEGER,
    printed_total INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, set_code)
);

-- 3. Tabla de Cartas (Datos Lógicos) - Estructura base universal
CREATE TABLE cards (
    card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
    card_name VARCHAR(200) NOT NULL,
    type_line VARCHAR(300),
    oracle_text TEXT,
    mana_cost VARCHAR(50),
    power VARCHAR(10),
    toughness VARCHAR(10),
    base_rarity VARCHAR(50),
    api_source_id VARCHAR(100),
    
    -- Campos específicos por TCG (JSON para máxima flexibilidad)
    tcg_specific_attributes JSONB DEFAULT '{}',
    
    -- Campos específicos más comunes (para optimización de consultas)
    hp VARCHAR(10), -- Para Pokémon, Flesh and Blood
    level VARCHAR(10), -- Para Yu-Gi-Oh!, Wixoss
    color VARCHAR(50), -- Para Lorcana, Wixoss, One Piece
    attribute VARCHAR(50), -- Para Yu-Gi-Oh!, One Piece
    loyalty VARCHAR(10), -- Para MTG Planeswalkers
    defense VARCHAR(10), -- Para MTG Battles
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, card_name)
);

-- 4. Tabla de Impresiones de Cartas (Versiones Físicas) - Estructura robusta
CREATE TABLE card_printings (
    printing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES cards(card_id) ON DELETE CASCADE,
    set_id INTEGER REFERENCES sets(set_id) ON DELETE CASCADE,
    collector_number VARCHAR(20),
    rarity VARCHAR(50),
    is_foil BOOLEAN DEFAULT false,
    is_non_foil BOOLEAN DEFAULT true,
    is_etched BOOLEAN DEFAULT false,
    is_alt_art BOOLEAN DEFAULT false,
    artist VARCHAR(200),
    image_url_small VARCHAR(500),
    image_url_normal VARCHAR(500),
    image_url_large VARCHAR(500),
    api_source_id VARCHAR(100),
    
    -- Campos específicos por TCG para impresiones (JSON)
    tcg_specific_printing_attributes JSONB DEFAULT '{}',
    
    -- Campos específicos más comunes para impresiones
    is_first_edition BOOLEAN DEFAULT false,
    is_full_art BOOLEAN DEFAULT false,
    is_borderless BOOLEAN DEFAULT false,
    is_showcase BOOLEAN DEFAULT false,
    is_promo BOOLEAN DEFAULT false,
    promo_type VARCHAR(50),
    frame_effects TEXT[],
    border_color VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(set_id, collector_number, is_foil, is_etched)
);

-- 5. Tabla de Condiciones
CREATE TABLE conditions (
    condition_id SERIAL PRIMARY KEY,
    condition_name VARCHAR(50) NOT NULL UNIQUE,
    condition_code VARCHAR(10) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Fuentes de Precios
CREATE TABLE sources (
    source_id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_code VARCHAR(20) NOT NULL UNIQUE,
    website_url VARCHAR(200),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    api_endpoint VARCHAR(500),
    api_key_required BOOLEAN DEFAULT false,
    rate_limit_per_minute INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla de Historial de Precios (Estructura robusta)
CREATE TABLE price_history (
    price_entry_id BIGSERIAL PRIMARY KEY,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES sources(source_id) ON DELETE CASCADE,
    condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
    price_usd DECIMAL(10, 2) NOT NULL,
    price_eur DECIMAL(10, 2),
    stock_quantity INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Campos adicionales para granularidad de precios
    price_type VARCHAR(20) DEFAULT 'market', -- market, buy, sell, low, mid, high
    is_foil BOOLEAN DEFAULT false,
    is_etched BOOLEAN DEFAULT false,
    
    UNIQUE(printing_id, source_id, condition_id, price_type, is_foil, is_etched, DATE(timestamp))
);

-- 8. Tabla de Precios Agregados (Caché optimizado)
CREATE TABLE aggregated_prices (
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
    avg_market_price_usd DECIMAL(10, 2),
    avg_market_price_eur DECIMAL(10, 2),
    buy_price_usd DECIMAL(10, 2),
    buy_price_eur DECIMAL(10, 2),
    low_price_usd DECIMAL(10, 2),
    low_price_eur DECIMAL(10, 2),
    high_price_usd DECIMAL(10, 2),
    high_price_eur DECIMAL(10, 2),
    price_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (printing_id, condition_id)
);

-- 9. Tabla de Colecciones de Usuario
CREATE TABLE user_collections (
    collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition_id INTEGER REFERENCES conditions(condition_id),
    purchase_price_usd DECIMAL(10, 2),
    purchase_price_eur DECIMAL(10, 2),
    purchase_date DATE,
    notes TEXT,
    is_for_trade BOOLEAN DEFAULT false,
    is_for_sale BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, printing_id, condition_id)
);

-- 10. Tabla de Lista de Seguimiento
CREATE TABLE user_watchlist (
    watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    target_price_usd DECIMAL(10, 2),
    target_price_eur DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, printing_id)
);

-- 11. Tabla de Atributos Específicos por TCG (Para consultas optimizadas)
CREATE TABLE card_attributes (
    attribute_id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_type VARCHAR(50) NOT NULL, -- string, integer, decimal, boolean, array
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, attribute_name)
);

-- 12. Tabla de Tipos de Cartas por TCG
CREATE TABLE card_types (
    type_id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
    type_name VARCHAR(100) NOT NULL,
    type_category VARCHAR(50), -- main, subtype, supertype
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, type_name)
);

-- 13. Tabla de Legalidades por Formato
CREATE TABLE card_legalities (
    legality_id SERIAL PRIMARY KEY,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    format_name VARCHAR(50) NOT NULL,
    legality_status VARCHAR(20) NOT NULL, -- legal, not_legal, restricted, banned
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(printing_id, format_name, effective_date)
);

-- 14. Tabla de Identificadores Externos (Para mapeo entre APIs)
CREATE TABLE external_identifiers (
    identifier_id SERIAL PRIMARY KEY,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES sources(source_id) ON DELETE CASCADE,
    external_id VARCHAR(100) NOT NULL,
    identifier_type VARCHAR(50), -- tcgplayer_id, cardmarket_id, scryfall_id, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(printing_id, source_id, identifier_type)
);

-- 15. Tabla de Imágenes de Cartas (Para múltiples resoluciones y fuentes)
CREATE TABLE card_images (
    image_id SERIAL PRIMARY KEY,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) NOT NULL, -- small, normal, large, art_crop, border_crop
    image_format VARCHAR(10), -- png, jpg, webp
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(printing_id, image_type)
);

-- Comentarios para documentación
COMMENT ON TABLE games IS 'Almacena información sobre los diferentes juegos de cartas coleccionables';
COMMENT ON TABLE sets IS 'Representa las diferentes ediciones o sets de cada juego';
COMMENT ON TABLE cards IS 'Almacena la información lógica de las cartas, independiente de sus impresiones físicas';
COMMENT ON TABLE card_printings IS 'Representa las diferentes impresiones físicas de una carta';
COMMENT ON TABLE conditions IS 'Define las diferentes condiciones físicas de las cartas';
COMMENT ON TABLE sources IS 'Define las diferentes fuentes de datos de precios';
COMMENT ON TABLE price_history IS 'Almacena el historial completo de precios de todas las impresiones';
COMMENT ON TABLE aggregated_prices IS 'Caché de precios calculados para optimizar consultas';
COMMENT ON TABLE user_collections IS 'Almacena las cartas que posee cada usuario';
COMMENT ON TABLE user_watchlist IS 'Cartas que el usuario quiere monitorear';
COMMENT ON TABLE card_attributes IS 'Define atributos específicos por TCG para consultas optimizadas';
COMMENT ON TABLE card_types IS 'Define tipos de cartas específicos por TCG';
COMMENT ON TABLE card_legalities IS 'Almacena la legalidad de cartas en diferentes formatos';
COMMENT ON TABLE external_identifiers IS 'Mapea identificadores entre diferentes APIs y fuentes';
COMMENT ON TABLE card_images IS 'Almacena URLs de imágenes en diferentes resoluciones y formatos'; 