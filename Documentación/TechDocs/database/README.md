# Base de Datos - Supabase

## Visión General

La base de datos está diseñada para almacenar información completa sobre cartas coleccionables, precios históricos, y colecciones de usuarios. Utilizamos Supabase como plataforma de base de datos PostgreSQL con funcionalidades adicionales como autenticación, real-time subscriptions y Edge Functions.

## Esquema de Base de Datos

### Tablas Principales

#### 1. Games (Juegos)
```sql
CREATE TABLE games (
    game_id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL UNIQUE,
    game_code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Sets (Ediciones)
```sql
CREATE TABLE sets (
    set_id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
    set_name VARCHAR(200) NOT NULL,
    set_code VARCHAR(20) NOT NULL,
    release_date DATE,
    is_digital BOOLEAN DEFAULT false,
    is_promo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, set_code)
);
```

#### 3. Cards (Cartas - Datos Lógicos)
```sql
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, card_name)
);
```

#### 4. Card Printings (Versiones Físicas)
```sql
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(set_id, collector_number, is_foil, is_etched)
);
```

#### 5. Conditions (Condiciones)
```sql
CREATE TABLE conditions (
    condition_id SERIAL PRIMARY KEY,
    condition_name VARCHAR(50) NOT NULL UNIQUE,
    condition_code VARCHAR(10) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. Sources (Fuentes de Precios)
```sql
CREATE TABLE sources (
    source_id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_code VARCHAR(20) NOT NULL UNIQUE,
    website_url VARCHAR(200),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. Price History (Historial de Precios)
```sql
CREATE TABLE price_history (
    price_entry_id BIGSERIAL PRIMARY KEY,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES sources(source_id) ON DELETE CASCADE,
    condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
    price_usd DECIMAL(10, 2) NOT NULL,
    price_eur DECIMAL(10, 2),
    stock_quantity INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(printing_id, source_id, condition_id, DATE(timestamp))
);
```

#### 8. Aggregated Prices (Precios Agregados)
```sql
CREATE TABLE aggregated_prices (
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
    avg_market_price_usd DECIMAL(10, 2),
    avg_market_price_eur DECIMAL(10, 2),
    buy_price_usd DECIMAL(10, 2),
    buy_price_eur DECIMAL(10, 2),
    price_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (printing_id, condition_id)
);
```

### Tablas de Usuario

#### 9. User Collections (Colecciones de Usuario)
```sql
CREATE TABLE user_collections (
    collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition_id INTEGER REFERENCES conditions(condition_id),
    purchase_price_usd DECIMAL(10, 2),
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, printing_id, condition_id)
);
```

#### 10. User Watchlist (Lista de Seguimiento)
```sql
CREATE TABLE user_watchlist (
    watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
    target_price_usd DECIMAL(10, 2),
    target_price_eur DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, printing_id)
);
```

## Índices

### Índices de Rendimiento
```sql
-- Búsqueda de cartas
CREATE INDEX idx_cards_game_name ON cards(game_id, card_name);
CREATE INDEX idx_cards_api_source ON cards(api_source_id);

-- Búsqueda de impresiones
CREATE INDEX idx_printings_set_collector ON card_printings(set_id, collector_number);
CREATE INDEX idx_printings_api_source ON card_printings(api_source_id);

-- Historial de precios
CREATE INDEX idx_price_history_printing_time ON price_history(printing_id, timestamp DESC);
CREATE INDEX idx_price_history_source_time ON price_history(source_id, timestamp DESC);
CREATE INDEX idx_price_history_condition ON price_history(condition_id);

-- Colecciones de usuario
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_printing ON user_collections(printing_id);

-- Precios agregados
CREATE INDEX idx_aggregated_prices_updated ON aggregated_prices(last_updated DESC);
```

## Triggers y Funciones

### 1. Actualización Automática de Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas relevantes
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_printings_updated_at BEFORE UPDATE ON card_printings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_collections_updated_at BEFORE UPDATE ON user_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_watchlist_updated_at BEFORE UPDATE ON user_watchlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Cálculo Automático de Precios Agregados
```sql
CREATE OR REPLACE FUNCTION calculate_aggregated_prices()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar o actualizar precios agregados
    INSERT INTO aggregated_prices (
        printing_id, 
        condition_id, 
        avg_market_price_usd, 
        avg_market_price_eur,
        buy_price_usd,
        buy_price_eur,
        price_count,
        last_updated
    )
    SELECT 
        ph.printing_id,
        ph.condition_id,
        AVG(ph.price_usd) as avg_market_price_usd,
        AVG(ph.price_eur) as avg_market_price_eur,
        AVG(ph.price_usd) * 0.6 as buy_price_usd,
        AVG(ph.price_eur) * 0.6 as buy_price_eur,
        COUNT(*) as price_count,
        NOW() as last_updated
    FROM price_history ph
    WHERE ph.printing_id = NEW.printing_id 
    AND ph.condition_id = NEW.condition_id
    AND ph.timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY ph.printing_id, ph.condition_id
    ON CONFLICT (printing_id, condition_id) 
    DO UPDATE SET
        avg_market_price_usd = EXCLUDED.avg_market_price_usd,
        avg_market_price_eur = EXCLUDED.avg_market_price_eur,
        buy_price_usd = EXCLUDED.buy_price_usd,
        buy_price_eur = EXCLUDED.buy_price_eur,
        price_count = EXCLUDED.price_count,
        last_updated = EXCLUDED.last_updated;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calculate_aggregated_prices 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION calculate_aggregated_prices();
```

## Row Level Security (RLS)

### Políticas de Seguridad
```sql
-- Habilitar RLS en tablas de usuario
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Políticas para user_collections
CREATE POLICY "Users can view their own collections" ON user_collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections" ON user_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON user_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON user_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_watchlist
CREATE POLICY "Users can view their own watchlist" ON user_watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" ON user_watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items" ON user_watchlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" ON user_watchlist
    FOR DELETE USING (auth.uid() = user_id);
```

## Datos Iniciales

### Condiciones Estándar
```sql
INSERT INTO conditions (condition_name, condition_code, sort_order) VALUES
('Near Mint', 'NM', 1),
('Lightly Played', 'LP', 2),
('Moderately Played', 'MP', 3),
('Heavily Played', 'HP', 4),
('Damaged', 'DM', 5);
```

### Juegos Soportados
```sql
INSERT INTO games (game_name, game_code) VALUES
('Magic: The Gathering', 'MTG'),
('Pokémon', 'POKEMON'),
('Lorcana', 'LORCANA'),
('Flesh and Blood', 'FAB'),
('Yu-Gi-Oh!', 'YUGIOH'),
('Wixoss', 'WIXOSS'),
('One Piece', 'ONEPIECE');
```

### Fuentes de Precios
```sql
INSERT INTO sources (source_name, source_code, website_url) VALUES
('TCGplayer', 'TCGPLAYER', 'https://www.tcgplayer.com'),
('Card Kingdom', 'CARDKINGDOM', 'https://www.cardkingdom.com'),
('Cardmarket', 'CARDMARKET', 'https://www.cardmarket.com'),
('Troll and Toad', 'TROLLANDTOAD', 'https://www.trollandtoad.com');
```

## Configuración de Supabase

### Variables de Entorno
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL=your_database_url
```

### Configuración de Autenticación
- Habilitar autenticación por email
- Configurar confirmación de email
- Configurar políticas de contraseñas
- Habilitar autenticación social (opcional)

### Configuración de Storage
- Bucket para imágenes de cartas
- Bucket para avatares de usuario
- Políticas de acceso configuradas

## Migraciones

### Estructura de Migraciones
```
database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_indexes.sql
│   ├── 003_add_triggers.sql
│   └── 004_add_rls.sql
├── seeds/
│   ├── 001_initial_data.sql
│   └── 002_test_data.sql
└── README.md
```

### Ejecutar Migraciones
```bash
# Usando Supabase CLI
supabase db reset
supabase db push

# O manualmente en el dashboard de Supabase
```

## Monitoreo y Mantenimiento

### Consultas de Monitoreo
```sql
-- Verificar tamaño de tablas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Verificar índices no utilizados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Verificar fragmentación
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

### Mantenimiento Regular
- Vacuum automático configurado
- Análisis de estadísticas semanal
- Backup automático diario
- Monitoreo de rendimiento 