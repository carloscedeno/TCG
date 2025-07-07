# Diccionario de Datos

## Visión General

Este diccionario de datos documenta todas las tablas, campos, tipos de datos, restricciones y reglas de negocio de la base de datos de la Plataforma Agregadora de Precios TCG.

## Tablas del Sistema

### 1. Games (Juegos)

**Descripción:** Almacena información sobre los diferentes juegos de cartas coleccionables soportados por la plataforma.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `game_id` | SERIAL | PRIMARY KEY | Identificador único del juego |
| `game_name` | VARCHAR(100) | NOT NULL, UNIQUE | Nombre completo del juego |
| `game_code` | VARCHAR(10) | NOT NULL, UNIQUE | Código abreviado del juego |
| `is_active` | BOOLEAN | DEFAULT true | Indica si el juego está activo en la plataforma |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación del registro |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Reglas de Negocio:**
- Un juego no puede ser eliminado si tiene cartas asociadas
- El `game_code` debe ser único y en mayúsculas
- Solo juegos activos aparecen en las búsquedas

**Ejemplos de Datos:**
```sql
INSERT INTO games (game_name, game_code) VALUES
('Magic: The Gathering', 'MTG'),
('Pokémon', 'POKEMON'),
('Lorcana', 'LORCANA');
```

### 2. Sets (Ediciones)

**Descripción:** Representa las diferentes ediciones o sets de cada juego.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `set_id` | SERIAL | PRIMARY KEY | Identificador único del set |
| `game_id` | INTEGER | FOREIGN KEY → games.game_id | Referencia al juego |
| `set_name` | VARCHAR(200) | NOT NULL | Nombre completo del set |
| `set_code` | VARCHAR(20) | NOT NULL | Código del set (ej. "MKM") |
| `release_date` | DATE | NULL | Fecha de lanzamiento del set |
| `is_digital` | BOOLEAN | DEFAULT false | Indica si es un set digital |
| `is_promo` | BOOLEAN | DEFAULT false | Indica si es un set promocional |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Restricciones:**
- UNIQUE(game_id, set_code)
- FOREIGN KEY a games.game_id ON DELETE CASCADE

**Reglas de Negocio:**
- Un set debe pertenecer a un juego válido
- El `set_code` debe ser único dentro del mismo juego
- Los sets promocionales pueden no tener fecha de lanzamiento

### 3. Cards (Cartas - Datos Lógicos)

**Descripción:** Almacena la información lógica de las cartas, independiente de sus impresiones físicas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `card_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único de la carta |
| `game_id` | INTEGER | FOREIGN KEY → games.game_id | Referencia al juego |
| `card_name` | VARCHAR(200) | NOT NULL | Nombre de la carta |
| `type_line` | VARCHAR(300) | NULL | Línea de tipo (ej. "Legendary Creature — Human Warrior") |
| `oracle_text` | TEXT | NULL | Texto de reglas de la carta |
| `mana_cost` | VARCHAR(50) | NULL | Costo de maná (ej. "{1}{U}{U}") |
| `power` | VARCHAR(10) | NULL | Poder de la criatura |
| `toughness` | VARCHAR(10) | NULL | Resistencia de la criatura |
| `base_rarity` | VARCHAR(50) | NULL | Rareza base de la carta |
| `api_source_id` | VARCHAR(100) | NULL | ID de la carta en la API externa |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Restricciones:**
- UNIQUE(game_id, card_name)
- FOREIGN KEY a games.game_id ON DELETE CASCADE

**Reglas de Negocio:**
- Una carta debe tener un nombre único dentro del mismo juego
- El `api_source_id` debe ser único si está presente
- Las cartas sin `mana_cost` pueden ser tierras o cartas especiales

### 4. Card Printings (Versiones Físicas)

**Descripción:** Representa las diferentes impresiones físicas de una carta (diferentes sets, foil, etc.).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `printing_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único de la impresión |
| `card_id` | UUID | FOREIGN KEY → cards.card_id | Referencia a la carta lógica |
| `set_id` | INTEGER | FOREIGN KEY → sets.set_id | Referencia al set |
| `collector_number` | VARCHAR(20) | NULL | Número de coleccionista |
| `rarity` | VARCHAR(50) | NULL | Rareza de esta impresión |
| `is_foil` | BOOLEAN | DEFAULT false | Indica si es versión foil |
| `is_non_foil` | BOOLEAN | DEFAULT true | Indica si tiene versión non-foil |
| `is_etched` | BOOLEAN | DEFAULT false | Indica si es etched foil |
| `is_alt_art` | BOOLEAN | DEFAULT false | Indica si es arte alternativo |
| `artist` | VARCHAR(200) | NULL | Nombre del artista |
| `image_url_small` | VARCHAR(500) | NULL | URL de imagen pequeña |
| `image_url_normal` | VARCHAR(500) | NULL | URL de imagen normal |
| `image_url_large` | VARCHAR(500) | NULL | URL de imagen grande |
| `api_source_id` | VARCHAR(100) | NULL | ID en la API externa |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Restricciones:**
- UNIQUE(set_id, collector_number, is_foil, is_etched)
- FOREIGN KEY a cards.card_id ON DELETE CASCADE
- FOREIGN KEY a sets.set_id ON DELETE CASCADE

**Reglas de Negocio:**
- Una impresión debe tener al menos una imagen (small, normal o large)
- `is_foil` y `is_non_foil` no pueden ser ambos false
- El `collector_number` debe ser único dentro del mismo set y acabado

### 5. Conditions (Condiciones)

**Descripción:** Define las diferentes condiciones físicas de las cartas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `condition_id` | SERIAL | PRIMARY KEY | Identificador único de la condición |
| `condition_name` | VARCHAR(50) | NOT NULL, UNIQUE | Nombre de la condición |
| `condition_code` | VARCHAR(10) | NOT NULL, UNIQUE | Código abreviado |
| `sort_order` | INTEGER | DEFAULT 0 | Orden de visualización |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Reglas de Negocio:**
- Las condiciones están ordenadas de mejor a peor
- No se pueden eliminar condiciones que tengan precios asociados

**Valores Estándar:**
```sql
INSERT INTO conditions (condition_name, condition_code, sort_order) VALUES
('Near Mint', 'NM', 1),
('Lightly Played', 'LP', 2),
('Moderately Played', 'MP', 3),
('Heavily Played', 'HP', 4),
('Damaged', 'DM', 5);
```

### 6. Sources (Fuentes de Precios)

**Descripción:** Define las diferentes fuentes de datos de precios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `source_id` | SERIAL | PRIMARY KEY | Identificador único de la fuente |
| `source_name` | VARCHAR(100) | NOT NULL, UNIQUE | Nombre de la fuente |
| `source_code` | VARCHAR(20) | NOT NULL, UNIQUE | Código de la fuente |
| `website_url` | VARCHAR(200) | NULL | URL del sitio web |
| `logo_url` | VARCHAR(500) | NULL | URL del logo |
| `is_active` | BOOLEAN | DEFAULT true | Indica si la fuente está activa |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Valores Estándar:**
```sql
INSERT INTO sources (source_name, source_code, website_url) VALUES
('TCGplayer', 'TCGPLAYER', 'https://www.tcgplayer.com'),
('Card Kingdom', 'CARDKINGDOM', 'https://www.cardkingdom.com'),
('Cardmarket', 'CARDMARKET', 'https://www.cardmarket.com'),
('Troll and Toad', 'TROLLANDTOAD', 'https://www.trollandtoad.com');
```

### 7. Price History (Historial de Precios)

**Descripción:** Almacena el historial completo de precios de todas las impresiones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `price_entry_id` | BIGSERIAL | PRIMARY KEY | Identificador único del registro |
| `printing_id` | UUID | FOREIGN KEY → card_printings.printing_id | Referencia a la impresión |
| `source_id` | INTEGER | FOREIGN KEY → sources.source_id | Referencia a la fuente |
| `condition_id` | INTEGER | FOREIGN KEY → conditions.condition_id | Referencia a la condición |
| `price_usd` | DECIMAL(10, 2) | NOT NULL | Precio en USD |
| `price_eur` | DECIMAL(10, 2) | NULL | Precio en EUR |
| `stock_quantity` | INTEGER | NULL | Cantidad en stock |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | Fecha y hora del precio |

**Restricciones:**
- UNIQUE(printing_id, source_id, condition_id, DATE(timestamp))
- FOREIGN KEY a card_printings.printing_id ON DELETE CASCADE
- FOREIGN KEY a sources.source_id ON DELETE CASCADE
- FOREIGN KEY a conditions.condition_id ON DELETE CASCADE

**Reglas de Negocio:**
- Solo se permite un precio por día por combinación única
- Los precios deben ser positivos
- El stock puede ser NULL si no está disponible

### 8. Aggregated Prices (Precios Agregados)

**Descripción:** Caché de precios calculados para optimizar consultas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `printing_id` | UUID | PRIMARY KEY, FOREIGN KEY → card_printings.printing_id | Referencia a la impresión |
| `condition_id` | INTEGER | PRIMARY KEY, FOREIGN KEY → conditions.condition_id | Referencia a la condición |
| `avg_market_price_usd` | DECIMAL(10, 2) | NULL | Precio promedio en USD |
| `avg_market_price_eur` | DECIMAL(10, 2) | NULL | Precio promedio en EUR |
| `buy_price_usd` | DECIMAL(10, 2) | NULL | Precio de compra sugerido USD |
| `buy_price_eur` | DECIMAL(10, 2) | NULL | Precio de compra sugerido EUR |
| `price_count` | INTEGER | DEFAULT 0 | Número de precios utilizados |
| `last_updated` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Restricciones:**
- PRIMARY KEY (printing_id, condition_id)
- FOREIGN KEY a card_printings.printing_id ON DELETE CASCADE
- FOREIGN KEY a conditions.condition_id ON DELETE CASCADE

**Reglas de Negocio:**
- Se actualiza automáticamente cuando cambian los precios
- El precio de compra es 60% del precio promedio
- Se calcula con precios de los últimos 7 días

### 9. User Collections (Colecciones de Usuario)

**Descripción:** Almacena las cartas que posee cada usuario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `collection_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `user_id` | UUID | FOREIGN KEY → auth.users.id | Referencia al usuario |
| `printing_id` | UUID | FOREIGN KEY → card_printings.printing_id | Referencia a la impresión |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | Cantidad de cartas |
| `condition_id` | INTEGER | FOREIGN KEY → conditions.condition_id | Condición de las cartas |
| `purchase_price_usd` | DECIMAL(10, 2) | NULL | Precio de compra en USD |
| `purchase_date` | DATE | NULL | Fecha de compra |
| `notes` | TEXT | NULL | Notas del usuario |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Restricciones:**
- UNIQUE(user_id, printing_id, condition_id)
- FOREIGN KEY a auth.users.id ON DELETE CASCADE
- FOREIGN KEY a card_printings.printing_id ON DELETE CASCADE
- FOREIGN KEY a conditions.condition_id ON DELETE CASCADE

**Reglas de Negocio:**
- Un usuario no puede tener la misma carta en la misma condición más de una vez
- La cantidad debe ser mayor a 0
- RLS habilitado para seguridad

### 10. User Watchlist (Lista de Seguimiento)

**Descripción:** Cartas que el usuario quiere monitorear.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `watchlist_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| `user_id` | UUID | FOREIGN KEY → auth.users.id | Referencia al usuario |
| `printing_id` | UUID | FOREIGN KEY → card_printings.printing_id | Referencia a la impresión |
| `target_price_usd` | DECIMAL(10, 2) | NULL | Precio objetivo en USD |
| `target_price_eur` | DECIMAL(10, 2) | NULL | Precio objetivo en EUR |
| `is_active` | BOOLEAN | DEFAULT true | Indica si está activo |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de última actualización |

**Restricciones:**
- UNIQUE(user_id, printing_id)
- FOREIGN KEY a auth.users.id ON DELETE CASCADE
- FOREIGN KEY a card_printings.printing_id ON DELETE CASCADE

**Reglas de Negocio:**
- Un usuario no puede tener la misma carta en watchlist más de una vez
- RLS habilitado para seguridad

## Mapeo de Condiciones

### Tabla de Mapeo Estándar

| Condición Estándar | TCGplayer | Cardmarket | Card Kingdom |
|-------------------|-----------|------------|--------------|
| Near Mint (NM) | Near Mint | Mint, Near Mint | NM/Mint (NM/M) |
| Lightly Played (LP) | Lightly Played | Slightly Played (SP) | Excellent (EX) |
| Moderately Played (MP) | Moderately Played | Played (PL) | Very Good (VG) |
| Heavily Played (HP) | Heavily Played | Heavily Played (HP) | Good (G) |
| Damaged | Damaged | Poor (PO) | Damaged (D/DM) |

## Tipos de Datos Personalizados

### Enum para Estados de Importación

```sql
CREATE TYPE import_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);
```

### Enum para Tipos de Notificación

```sql
CREATE TYPE notification_type AS ENUM (
    'price_alert',
    'watchlist_target',
    'collection_update',
    'system_alert'
);
```

## Índices y Optimización

### Índices Principales

```sql
-- Búsqueda de cartas por nombre y juego
CREATE INDEX idx_cards_game_name ON cards(game_id, card_name);

-- Búsqueda de impresiones por set
CREATE INDEX idx_printings_set_collector ON card_printings(set_id, collector_number);

-- Historial de precios por impresión y tiempo
CREATE INDEX idx_price_history_printing_time ON price_history(printing_id, timestamp DESC);

-- Colecciones de usuario
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_printing ON user_collections(printing_id);
```

### Índices Compuestos

```sql
-- Búsqueda de precios agregados
CREATE INDEX idx_aggregated_prices_lookup ON aggregated_prices(printing_id, condition_id);

-- Búsqueda de watchlist
CREATE INDEX idx_user_watchlist_lookup ON user_watchlist(user_id, is_active);
```

## Triggers y Funciones

### Función de Actualización de Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Función de Cálculo de Precios Agregados

```sql
CREATE OR REPLACE FUNCTION calculate_aggregated_prices()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica de cálculo automático
    -- Ver implementación completa en documentación de base de datos
END;
$$ language 'plpgsql';
```

## Políticas de Seguridad (RLS)

### Políticas de Usuario

```sql
-- Políticas para user_collections
CREATE POLICY "Users can view own collections" ON user_collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON user_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para user_watchlist
CREATE POLICY "Users can view own watchlist" ON user_watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items" ON user_watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Validaciones y Constraints

### Constraints de Negocio

```sql
-- Precios deben ser positivos
ALTER TABLE price_history ADD CONSTRAINT check_positive_price 
    CHECK (price_usd > 0);

-- Cantidad debe ser positiva
ALTER TABLE user_collections ADD CONSTRAINT check_positive_quantity 
    CHECK (quantity > 0);

-- Fecha de compra no puede ser futura
ALTER TABLE user_collections ADD CONSTRAINT check_valid_purchase_date 
    CHECK (purchase_date <= CURRENT_DATE);
```

## Consideraciones de Rendimiento

### Particionamiento

Para tablas grandes como `price_history`, considerar particionamiento por fecha:

```sql
-- Particionamiento por mes
CREATE TABLE price_history_2024_01 PARTITION OF price_history
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Materialized Views

```sql
-- Vista materializada para estadísticas de usuario
CREATE MATERIALIZED VIEW user_collection_stats AS
SELECT 
    user_id,
    COUNT(*) as total_cards,
    SUM(quantity) as total_quantity,
    AVG(purchase_price_usd) as avg_purchase_price
FROM user_collections
GROUP BY user_id;
```

## Mantenimiento

### Limpieza de Datos

```sql
-- Eliminar precios antiguos (más de 2 años)
DELETE FROM price_history 
WHERE timestamp < NOW() - INTERVAL '2 years';

-- Limpiar watchlist inactivo (más de 1 año)
UPDATE user_watchlist 
SET is_active = false 
WHERE updated_at < NOW() - INTERVAL '1 year' AND is_active = true;
```

### Estadísticas de Uso

```sql
-- Consulta para estadísticas de uso
SELECT 
    COUNT(*) as total_cards,
    COUNT(DISTINCT user_id) as active_users,
    AVG(quantity) as avg_cards_per_user
FROM user_collections;
``` 