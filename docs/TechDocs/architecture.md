# Arquitectura del Sistema TCG Price Aggregator

## Visión General

El sistema TCG Price Aggregator es una plataforma robusta diseñada para manejar múltiples juegos de cartas coleccionables (TCG) con una arquitectura escalable y flexible. El sistema está construido para soportar las complejidades específicas de cada TCG mientras mantiene una base de datos unificada y eficiente.

## TCGs Soportados

El sistema está diseñado para manejar los siguientes juegos de cartas:

1. **Magic: The Gathering (MTG)** - El primer y más complejo TCG
2. **Pokémon TCG** - Juego basado en la franquicia Pokémon
3. **Lorcana** - Juego de Disney con mecánicas de tinta
4. **Flesh and Blood (FAB)** - Juego competitivo con pitch
5. **Yu-Gi-Oh!** - Juego japonés con múltiples tipos de monstruos
6. **Wixoss** - Juego japonés con mazos duales
7. **One Piece TCG** - Juego basado en el anime One Piece

## Arquitectura de Base de Datos

### Diseño Robusto Multi-TCG

La base de datos utiliza un diseño híbrido que combina:

- **Campos específicos optimizados** para atributos comunes (HP, Level, Color, etc.)
- **Campos JSONB** para atributos específicos de cada TCG
- **Separación lógica vs física** de las cartas
- **Sistema de versionado temporal** para precios

### Estructura Principal

#### 1. Tablas Core

```sql
-- Juegos soportados
games (game_id, game_name, game_code, description, is_active)

-- Sets/Ediciones por juego
sets (set_id, game_id, set_name, set_code, release_date, total_cards)

-- Cartas (datos lógicos)
cards (card_id, game_id, card_name, type_line, oracle_text, mana_cost, 
       power, toughness, base_rarity, hp, level, color, attribute, 
       loyalty, defense, tcg_specific_attributes)

-- Impresiones (versiones físicas)
card_printings (printing_id, card_id, set_id, collector_number, rarity,
                is_foil, is_etched, is_alt_art, is_first_edition,
                tcg_specific_printing_attributes)
```

#### 2. Sistema de Precios

```sql
-- Historial completo de precios
price_history (price_entry_id, printing_id, source_id, condition_id,
               price_usd, price_eur, stock_quantity, timestamp,
               price_type, is_foil, is_etched)

-- Precios agregados (caché optimizado)
aggregated_prices (printing_id, condition_id, avg_market_price_usd,
                   low_price_usd, high_price_usd, price_count, last_updated)
```

#### 3. Atributos Específicos por TCG

```sql
-- Definición de atributos por TCG
card_attributes (attribute_id, game_id, attribute_name, attribute_type,
                 description, is_required, sort_order)

-- Tipos de cartas por TCG
card_types (type_id, game_id, type_name, type_category, description, sort_order)
```

### Ventajas del Diseño

1. **Flexibilidad Total**: Los campos JSONB permiten almacenar cualquier atributo específico de cada TCG
2. **Optimización de Consultas**: Los campos más comunes tienen índices específicos
3. **Escalabilidad**: La separación lógica vs física permite manejar millones de cartas
4. **Versionado Temporal**: Los precios mantienen historial completo
5. **Normalización**: Condiciones y fuentes estandarizadas

## Arquitectura del Sistema de Scraping

### Gestor Multi-TCG

El sistema utiliza un `TCGScraperManager` que:

- **Detecta automáticamente** el TCG basado en la URL
- **Normaliza precios** y condiciones entre diferentes fuentes
- **Mapea atributos específicos** de cada TCG
- **Maneja errores** de forma robusta

### Scrapers Especializados

Cada marketplace tiene su propio scraper:

```python
class CardmarketScraper:
    """Scraper especializado para Cardmarket"""
    
class CardKingdomScraper:
    """Scraper especializado para Card Kingdom"""
    
class TCGPlayerScraper:
    """Scraper especializado para TCGplayer"""
    
class TrollAndToadScraper:
    """Scraper especializado para Troll and Toad"""
```

### Normalización de Datos

#### Precios
- **Detección automática** de monedas ($, €, £, ¥)
- **Conversión de formatos** (1.234,56 → 1234.56)
- **Validación** de valores numéricos

#### Condiciones
- **Mapeo estandarizado** entre fuentes
- **Códigos normalizados** (NM, LP, MP, HP, DM)
- **Soporte para grados** (PSA, BGS, CGC)

#### Atributos TCG
- **Mapeo automático** de campos específicos
- **Validación** de tipos de datos
- **Almacenamiento JSON** para máxima flexibilidad

## APIs y Fuentes de Datos

### Fuentes Principales

1. **Scraping de Marketplaces**:
   - Cardmarket (Europa)
   - TCGplayer (Norteamérica)
   - Card Kingdom (Norteamérica)
   - Troll and Toad (Norteamérica)

2. **APIs Externas** (futuro):
   - Scryfall API (MTG)
   - Pokémon TCG API
   - JustTCG API (multi-TCG)

### Integración con Supabase

```python
class SupabaseClient:
    """Cliente para integración con Supabase"""
    
    def insert_price_history(self, price_data: List[Dict]) -> bool:
        """Inserta historial de precios"""
        
    def update_aggregated_prices(self) -> bool:
        """Actualiza precios agregados"""
        
    def get_card_data(self, game_code: str, card_name: str) -> Optional[Dict]:
        """Obtiene datos de una carta"""
```

## Características Específicas por TCG

### Magic: The Gathering
- **Tipos de cartas**: Creature, Instant, Sorcery, Land, Artifact, Enchantment, Planeswalker, Battle
- **Atributos específicos**: Loyalty (Planeswalkers), Defense (Battles), Frame effects
- **Variantes**: Foil, Etched, Full Art, Borderless, Showcase

### Pokémon TCG
- **Tipos de cartas**: Pokémon, Trainer, Energy
- **Atributos específicos**: HP, Evolutions, Weaknesses, Resistances, Retreat Cost
- **Variantes**: Holo, Reverse Holo, Full Art, Rainbow Rare, Gold Rare

### Lorcana
- **Tipos de cartas**: Character, Action, Song
- **Atributos específicos**: Ink Color, Inkwell, Strength, Willpower, Lore
- **Variantes**: Enchanted, Full Art, Promo

### Flesh and Blood
- **Tipos de cartas**: Hero, Weapon, Equipment, Action, Reaction
- **Atributos específicos**: Pitch Value, Life, Intellect, Class, Talents
- **Variantes**: Cold Foil, Rainbow Foil

### Yu-Gi-Oh!
- **Tipos de cartas**: Monster, Spell, Trap
- **Atributos específicos**: Level, Race, Link, Scale, Archetype
- **Variantes**: Ultra Rare, Secret Rare, Ghost Rare

### Wixoss
- **Tipos de cartas**: LRIG, SIGNI, Arts, Spell, PIECE
- **Atributos específicos**: Color, Level, Limit, Grow Cost, Life Burst
- **Variantes**: Foil, Full Art

### One Piece TCG
- **Tipos de cartas**: Leader, Character, Event, Stage
- **Atributos específicos**: Color, Counter, Subtypes, Leader
- **Variantes**: Secret Rare, Manga Rare, Alt Art

## Optimización y Rendimiento

### Índices Estratégicos

```sql
-- Búsqueda de cartas
CREATE INDEX idx_cards_game_name ON cards(game_id, card_name);
CREATE INDEX idx_cards_full_text_search ON cards USING gin(...);

-- Precios
CREATE INDEX idx_price_history_printing_time ON price_history(printing_id, timestamp DESC);
CREATE INDEX idx_aggregated_prices_lookup ON aggregated_prices(printing_id, condition_id);

-- Atributos específicos
CREATE INDEX idx_cards_hp ON cards(hp) WHERE hp IS NOT NULL;
CREATE INDEX idx_cards_level ON cards(level) WHERE level IS NOT NULL;
```

### Caché de Precios Agregados

- **Actualización automática** de precios agregados
- **Cálculo de rangos** (low, mid, high)
- **Conteo de fuentes** disponibles
- **Timestamp de última actualización**

### Consultas Optimizadas

```sql
-- Búsqueda de cartas por TCG y atributos
SELECT * FROM cards 
WHERE game_id = (SELECT game_id FROM games WHERE game_code = 'MTG')
  AND hp IS NOT NULL
  AND hp::integer > 5;

-- Precios actuales con rangos
SELECT cp.collector_number, c.card_name, ap.avg_market_price_usd,
       ap.low_price_usd, ap.high_price_usd, ap.price_count
FROM aggregated_prices ap
JOIN card_printings cp ON ap.printing_id = cp.printing_id
JOIN cards c ON cp.card_id = c.card_id
WHERE ap.last_updated > NOW() - INTERVAL '7 days';
```

## Seguridad y Privacidad

### Row Level Security (RLS)

```sql
-- Políticas para colecciones de usuario
CREATE POLICY "Users can only see their own collections"
ON user_collections FOR ALL
USING (auth.uid() = user_id);

-- Políticas para watchlist
CREATE POLICY "Users can only see their own watchlist"
ON user_watchlist FOR ALL
USING (auth.uid() = user_id);
```

### Validación de Datos

- **Triggers** para validación automática
- **Constraints** para integridad referencial
- **Validación** de tipos de datos JSON
- **Sanitización** de datos de entrada

## Escalabilidad y Mantenimiento

### Particionamiento

- **Particionamiento por fecha** en `price_history`
- **Particionamiento por juego** en `cards` y `card_printings`
- **Archivado automático** de datos históricos

### Monitoreo

- **Logs detallados** de scraping
- **Métricas de rendimiento** de consultas
- **Alertas** para errores de scraping
- **Dashboard** de salud del sistema

### Backup y Recuperación

- **Backup automático** diario
- **Point-in-time recovery**
- **Replicación** en múltiples regiones
- **Testing** de restauración

## Roadmap y Futuras Mejoras

### Corto Plazo (1-3 meses)
- [ ] Integración con APIs externas
- [ ] Sistema de notificaciones de precios
- [ ] Dashboard de análisis de tendencias
- [ ] API REST pública

### Mediano Plazo (3-6 meses)
- [ ] Machine Learning para predicción de precios
- [ ] Sistema de alertas inteligentes
- [ ] Integración con más marketplaces
- [ ] App móvil

### Largo Plazo (6+ meses)
- [ ] Análisis de mercado avanzado
- [ ] Integración con exchanges de criptomonedas
- [ ] Sistema de trading automatizado
- [ ] Expansión a otros mercados

## Conclusión

La arquitectura del sistema TCG Price Aggregator está diseñada para ser:

- **Robusta**: Maneja las complejidades de múltiples TCG
- **Escalable**: Puede crecer con el volumen de datos
- **Flexible**: Se adapta a nuevos TCG y atributos
- **Eficiente**: Optimizada para consultas rápidas
- **Segura**: Protege los datos de los usuarios
- **Mantenible**: Fácil de actualizar y extender

Esta base sólida permite construir una plataforma completa para el análisis y seguimiento de precios de cartas coleccionables. 