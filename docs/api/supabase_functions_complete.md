# Funciones SQL y Edge Functions para Supabase - Guía Completa

Este documento contiene todas las funciones SQL y Edge Functions necesarias para el sistema TCG Marketplace, organizadas y listas para copiar/pegar en Supabase Cloud.

## 📋 Índice

1. [Funciones SQL](#funciones-sql)
   - [Funciones de Triggers](#funciones-de-triggers)
   - [Funciones de Validación](#funciones-de-validación)
   - [Funciones de Cálculo](#funciones-de-cálculo)
   - [Funciones de Utilidad](#funciones-de-utilidad)
   - [Funciones de Seguridad](#funciones-de-seguridad)

2. [Edge Functions](#edge-functions)
   - [Función Principal TCG API](#función-principal-tcg-api)
   - [Configuración de Despliegue](#configuración-de-despliegue)

---

## 🗄️ Funciones SQL

### Funciones de Triggers

#### 1. Función de Actualización de Timestamps

```sql
-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas relevantes
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at 
    BEFORE UPDATE ON sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_printings_updated_at 
    BEFORE UPDATE ON card_printings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at 
    BEFORE UPDATE ON sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collections_updated_at 
    BEFORE UPDATE ON user_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_watchlist_updated_at 
    BEFORE UPDATE ON user_watchlist 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2. Función de Cálculo de Precios Agregados

```sql
-- Función para calcular precios agregados automáticamente
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

-- Trigger para cálculo automático de precios agregados
CREATE TRIGGER trigger_calculate_aggregated_prices 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION calculate_aggregated_prices();
```

#### 3. Función de Notificaciones de Cambios de Precios

```sql
-- Función para notificar cambios de precios (para real-time)
CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar cambios de precios para real-time subscriptions
    PERFORM pg_notify(
        'price_changes',
        json_build_object(
            'printing_id', NEW.printing_id,
            'condition_id', NEW.condition_id,
            'price_usd', NEW.price_usd,
            'timestamp', NEW.timestamp
        )::text
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para notificaciones de cambios de precios
CREATE TRIGGER notify_price_change_trigger 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION notify_price_change();
```

### Funciones de Validación

#### 4. Función de Validación de Datos de Cartas

```sql
-- Función para validar datos de entrada
CREATE OR REPLACE FUNCTION validate_card_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que el nombre de la carta no esté vacío
    IF NEW.card_name IS NULL OR LENGTH(TRIM(NEW.card_name)) = 0 THEN
        RAISE EXCEPTION 'El nombre de la carta no puede estar vacío';
    END IF;
    
    -- Validar que el juego existe y está activo
    IF NOT EXISTS (SELECT 1 FROM games WHERE game_id = NEW.game_id AND is_active = true) THEN
        RAISE EXCEPTION 'El juego especificado no existe o no está activo';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validación de datos de cartas
CREATE TRIGGER validate_card_data_trigger 
    BEFORE INSERT OR UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION validate_card_data();
```

#### 5. Función de Validación de Precios

```sql
-- Función para validar precios
CREATE OR REPLACE FUNCTION validate_price_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que el precio USD sea positivo
    IF NEW.price_usd <= 0 THEN
        RAISE EXCEPTION 'El precio USD debe ser mayor a 0';
    END IF;
    
    -- Validar que el precio EUR sea positivo si está presente
    IF NEW.price_eur IS NOT NULL AND NEW.price_eur <= 0 THEN
        RAISE EXCEPTION 'El precio EUR debe ser mayor a 0';
    END IF;
    
    -- Validar que la cantidad de stock sea no negativa
    IF NEW.stock_quantity IS NOT NULL AND NEW.stock_quantity < 0 THEN
        RAISE EXCEPTION 'La cantidad de stock no puede ser negativa';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validación de datos de precios
CREATE TRIGGER validate_price_data_trigger 
    BEFORE INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION validate_price_data();
```

### Funciones de Cálculo

#### 6. Función de Cálculo de Tendencias de Precios

```sql
-- Función para calcular tendencias de precios
CREATE OR REPLACE FUNCTION calculate_price_trends(printing_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    avg_price_usd DECIMAL(10, 2),
    min_price_usd DECIMAL(10, 2),
    max_price_usd DECIMAL(10, 2),
    price_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ph.timestamp) as date,
        AVG(ph.price_usd) as avg_price_usd,
        MIN(ph.price_usd) as min_price_usd,
        MAX(ph.price_usd) as max_price_usd,
        COUNT(*) as price_count
    FROM price_history ph
    WHERE ph.printing_id = printing_uuid
    AND ph.timestamp >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY DATE(ph.timestamp)
    ORDER BY date DESC;
END;
$$ language 'plpgsql';
```

#### 7. Función de Estadísticas de Usuario

```sql
-- Función para obtener estadísticas de usuario
CREATE OR REPLACE FUNCTION get_user_collection_stats(user_uuid UUID)
RETURNS TABLE (
    total_cards BIGINT,
    total_quantity BIGINT,
    total_value_usd DECIMAL(12, 2),
    total_value_eur DECIMAL(12, 2),
    avg_purchase_price_usd DECIMAL(10, 2),
    cards_with_purchase_price BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_cards,
        SUM(uc.quantity) as total_quantity,
        SUM(uc.quantity * COALESCE(ap.avg_market_price_usd, 0)) as total_value_usd,
        SUM(uc.quantity * COALESCE(ap.avg_market_price_eur, 0)) as total_value_eur,
        AVG(uc.purchase_price_usd) as avg_purchase_price_usd,
        COUNT(uc.purchase_price_usd) as cards_with_purchase_price
    FROM user_collections uc
    LEFT JOIN aggregated_prices ap ON uc.printing_id = ap.printing_id AND uc.condition_id = ap.condition_id
    WHERE uc.user_id = user_uuid;
END;
$$ language 'plpgsql';
```

### Funciones de Utilidad

#### 8. Función de Limpieza de Datos Antiguos

```sql
-- Función para limpiar datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Eliminar precios históricos de más de 2 años
    DELETE FROM price_history 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    -- Desactivar watchlist inactivo de más de 1 año
    UPDATE user_watchlist 
    SET is_active = false 
    WHERE updated_at < NOW() - INTERVAL '1 year' AND is_active = true;
    
    -- Log de limpieza
    RAISE NOTICE 'Limpieza de datos antiguos completada: %', NOW();
END;
$$ language 'plpgsql';
```

#### 9. Función de Búsqueda de Cartas con Precios

```sql
-- Función para buscar cartas con precios
CREATE OR REPLACE FUNCTION search_cards_with_prices(
    search_query TEXT,
    game_code_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    card_id UUID,
    card_name TEXT,
    game_name TEXT,
    set_name TEXT,
    collector_number TEXT,
    rarity TEXT,
    avg_price_usd DECIMAL(10,2),
    low_price_usd DECIMAL(10,2),
    high_price_usd DECIMAL(10,2),
    price_count INTEGER,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.card_id,
        c.card_name,
        g.game_name,
        s.set_name,
        cp.collector_number,
        cp.rarity,
        ap.avg_market_price_usd,
        ap.low_price_usd,
        ap.high_price_usd,
        ap.price_count,
        cp.image_url_normal
    FROM cards c
    JOIN games g ON c.game_id = g.game_id
    JOIN card_printings cp ON c.card_id = cp.card_id
    JOIN sets s ON cp.set_id = s.set_id
    LEFT JOIN aggregated_prices ap ON cp.printing_id = ap.printing_id
    WHERE 
        (search_query IS NULL OR c.card_name ILIKE '%' || search_query || '%')
        AND (game_code_filter IS NULL OR g.game_code = game_code_filter)
    ORDER BY c.card_name, s.release_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

#### 10. Función de Obtención de Precios de Carta

```sql
-- Función para obtener precios de una carta
CREATE OR REPLACE FUNCTION get_card_prices(
    card_uuid UUID,
    condition_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
    printing_id UUID,
    set_name TEXT,
    collector_number TEXT,
    rarity TEXT,
    is_foil BOOLEAN,
    condition_name TEXT,
    price_usd DECIMAL(10,2),
    price_eur DECIMAL(10,2),
    source_name TEXT,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.printing_id,
        s.set_name,
        cp.collector_number,
        cp.rarity,
        cp.is_foil,
        cond.condition_name,
        ph.price_usd,
        ph.price_eur,
        src.source_name,
        ph.timestamp
    FROM card_printings cp
    JOIN sets s ON cp.set_id = s.set_id
    JOIN price_history ph ON cp.printing_id = ph.printing_id
    JOIN conditions cond ON ph.condition_id = cond.condition_id
    JOIN sources src ON ph.source_id = src.source_id
    WHERE cp.card_id = card_uuid
        AND (condition_filter IS NULL OR ph.condition_id = condition_filter)
    ORDER BY ph.timestamp DESC, cp.is_foil, cond.sort_order;
END;
$$ LANGUAGE plpgsql;
```

### Funciones de Seguridad

#### 11. Función de Verificación de Administrador

```sql
-- Función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 12. Función de Verificación de Servicio

```sql
-- Función para verificar si un usuario es servicio
CREATE OR REPLACE FUNCTION is_service()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' IN ('admin', 'service')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 13. Función de Obtención del ID de Usuario Actual

```sql
-- Función para obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 14. Función de Auditoría de Cambios

```sql
-- Función para auditar cambios en colecciones de usuario
CREATE OR REPLACE FUNCTION audit_user_collection_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear log de cambios (opcional, para auditoría)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, operation, user_id, record_id, old_data, new_data)
        VALUES ('user_collections', 'INSERT', auth.uid(), NEW.collection_id, NULL, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, operation, user_id, record_id, old_data, new_data)
        VALUES ('user_collections', 'UPDATE', auth.uid(), NEW.collection_id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, operation, user_id, record_id, old_data, new_data)
        VALUES ('user_collections', 'DELETE', auth.uid(), OLD.collection_id, to_jsonb(OLD), NULL);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Comentarios para Documentación

```sql
-- Comentarios para documentación
COMMENT ON FUNCTION update_updated_at_column() IS 'Actualiza automáticamente el campo updated_at en todas las tablas';
COMMENT ON FUNCTION calculate_aggregated_prices() IS 'Calcula automáticamente los precios agregados cuando se actualiza el historial';
COMMENT ON FUNCTION validate_card_data() IS 'Valida los datos de entrada para las cartas';
COMMENT ON FUNCTION validate_price_data() IS 'Valida los datos de entrada para los precios';
COMMENT ON FUNCTION cleanup_old_data() IS 'Limpia datos antiguos para mantener el rendimiento';
COMMENT ON FUNCTION get_user_collection_stats(UUID) IS 'Obtiene estadísticas de la colección de un usuario';
COMMENT ON FUNCTION notify_price_change() IS 'Notifica cambios de precios para real-time subscriptions';
COMMENT ON FUNCTION calculate_price_trends(UUID, INTEGER) IS 'Calcula tendencias de precios para una impresión específica';
COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario actual tiene rol de administrador';
COMMENT ON FUNCTION is_service() IS 'Verifica si el usuario actual tiene rol de servicio';
COMMENT ON FUNCTION current_user_id() IS 'Obtiene el ID del usuario actual';
COMMENT ON FUNCTION audit_user_collection_changes() IS 'Audita cambios en colecciones de usuario';
```

---

## ⚡ Edge Functions

### Función Principal TCG API

#### Archivo: `supabase/functions/tcg-api/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Parse request body
    let body = {}
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    // Route handling
    let response

    // Games endpoints
    if (path.startsWith('/api/games')) {
      response = await handleGamesEndpoint(supabase, path, method, body)
    }
    // Sets endpoints
    else if (path.startsWith('/api/sets')) {
      response = await handleSetsEndpoint(supabase, path, method, body)
    }
    // Cards endpoints
    else if (path.startsWith('/api/cards')) {
      response = await handleCardsEndpoint(supabase, path, method, body)
    }
    // Prices endpoints
    else if (path.startsWith('/api/prices')) {
      response = await handlePricesEndpoint(supabase, path, method, body)
    }
    // Search endpoints
    else if (path.startsWith('/api/search')) {
      response = await handleSearchEndpoint(supabase, path, method, body)
    }
    // Collections endpoints
    else if (path.startsWith('/api/collections')) {
      response = await handleCollectionsEndpoint(supabase, path, method, body)
    }
    // Watchlists endpoints
    else if (path.startsWith('/api/watchlists')) {
      response = await handleWatchlistsEndpoint(supabase, path, method, body)
    }
    // Statistics endpoints
    else if (path.startsWith('/api/stats')) {
      response = await handleStatsEndpoint(supabase, path, method, body)
    }
    else {
      response = {
        error: 'Endpoint not found',
        available_endpoints: [
          '/api/games',
          '/api/sets',
          '/api/cards',
          '/api/prices',
          '/api/search',
          '/api/collections',
          '/api/watchlists',
          '/api/stats'
        ]
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.error ? 400 : 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Games endpoints
async function handleGamesEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/games') {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      return { games: data }
    }
    
    // GET /api/games/{game_code}
    const gameCode = path.split('/').pop()
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single()
    
    if (error) throw error
    return { game: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('games')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { game: data }
  }
  
  throw new Error('Method not allowed')
}

// Sets endpoints
async function handleSetsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/sets') {
      const { game_code } = body
      let query = supabase
        .from('sets')
        .select('*, games(game_name, game_code)')
        .eq('is_digital', false)
      
      if (game_code) {
        query = query.eq('games.game_code', game_code)
      }
      
      const { data, error } = await query
      if (error) throw error
      return { sets: data }
    }
    
    // GET /api/sets/{set_id}
    const setId = path.split('/').pop()
    const { data, error } = await supabase
      .from('sets')
      .select('*, games(game_name, game_code)')
      .eq('set_id', setId)
      .single()
    
    if (error) throw error
    return { set: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('sets')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { set: data }
  }
  
  throw new Error('Method not allowed')
}

// Cards endpoints
async function handleCardsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    if (path === '/api/cards') {
      const { game_code, set_id, limit = 50 } = body
      let query = supabase
        .from('cards')
        .select(`
          *,
          games(game_name, game_code),
          card_printings(
            *,
            sets(set_name, set_code)
          )
        `)
      
      if (game_code) {
        query = query.eq('games.game_code', game_code)
      }
      
      if (set_id) {
        query = query.eq('card_printings.set_id', set_id)
      }
      
      const { data, error } = await query.limit(limit)
      if (error) throw error
      return { cards: data }
    }
    
    // GET /api/cards/{card_id}
    const cardId = path.split('/').pop()
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        games(game_name, game_code),
        card_printings(
          *,
          sets(set_name, set_code),
          aggregated_prices(*)
        )
      `)
      .eq('card_id', cardId)
      .single()
    
    if (error) throw error
    return { card: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('cards')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { card: data }
  }
  
  throw new Error('Method not allowed')
}

// Prices endpoints
async function handlePricesEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    const { printing_id, condition_id, days = 30 } = body
    
    let query = supabase
      .from('price_history')
      .select(`
        *,
        conditions(condition_name),
        sources(source_name)
      `)
      .order('timestamp', { ascending: false })
    
    if (printing_id) {
      query = query.eq('printing_id', printing_id)
    }
    
    if (condition_id) {
      query = query.eq('condition_id', condition_id)
    }
    
    if (days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      query = query.gte('timestamp', cutoffDate.toISOString())
    }
    
    const { data, error } = await query
    if (error) throw error
    return { prices: data }
  }
  
  if (method === 'POST') {
    const { data, error } = await supabase
      .from('price_history')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return { price: data }
  }
  
  throw new Error('Method not allowed')
}

// Search endpoints
async function handleSearchEndpoint(supabase, path, method, body) {
  if (method === 'POST') {
    const { query, game_code, limit = 20 } = body
    
    if (!query) {
      throw new Error('Search query is required')
    }
    
    const { data, error } = await supabase
      .rpc('search_cards_with_prices', {
        search_query: query,
        game_code_filter: game_code,
        limit_count: limit
      })
    
    if (error) throw error
    return { results: data }
  }
  
  throw new Error('Method not allowed')
}

// Collections endpoints
async function handleCollectionsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('user_collections')
      .select(`
        *,
        card_printings(
          *,
          cards(card_name),
          sets(set_name)
        ),
        conditions(condition_name)
      `)
      .eq('user_id', user.id)
    
    if (error) throw error
    return { collection: data }
  }
  
  if (method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('user_collections')
      .insert({
        ...body,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return { collection_item: data }
  }
  
  if (method === 'PUT') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const collectionId = path.split('/').pop()
    const { data, error } = await supabase
      .from('user_collections')
      .update(body)
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return { collection_item: data }
  }
  
  if (method === 'DELETE') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const collectionId = path.split('/').pop()
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
    
    if (error) throw error
    return { message: 'Collection item deleted' }
  }
  
  throw new Error('Method not allowed')
}

// Watchlists endpoints
async function handleWatchlistsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('user_watchlist')
      .select(`
        *,
        card_printings(
          *,
          cards(card_name),
          sets(set_name)
        ),
        aggregated_prices(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    if (error) throw error
    return { watchlist: data }
  }
  
  if (method === 'POST') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('user_watchlist')
      .insert({
        ...body,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return { watchlist_item: data }
  }
  
  if (method === 'PUT') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const watchlistId = path.split('/').pop()
    const { data, error } = await supabase
      .from('user_watchlist')
      .update(body)
      .eq('watchlist_id', watchlistId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return { watchlist_item: data }
  }
  
  if (method === 'DELETE') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const watchlistId = path.split('/').pop()
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('user_id', user.id)
    
    if (error) throw error
    return { message: 'Watchlist item deleted' }
  }
  
  throw new Error('Method not allowed')
}

// Statistics endpoints
async function handleStatsEndpoint(supabase, path, method, body) {
  if (method === 'GET') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    if (path === '/api/stats/collection') {
      const { data, error } = await supabase
        .rpc('get_user_collection_stats', { user_uuid: user.id })
      
      if (error) throw error
      return { stats: data }
    }
    
    if (path === '/api/stats/prices') {
      const { printing_id, days = 30 } = body
      
      if (!printing_id) {
        throw new Error('printing_id is required for price stats')
      }
      
      const { data, error } = await supabase
        .rpc('calculate_price_trends', { 
          printing_uuid: printing_id, 
          days_back: days 
        })
      
      if (error) throw error
      return { price_trends: data }
    }
  }
  
  throw new Error('Method not allowed')
}
```

### Configuración de Despliegue

#### Archivo: `supabase/functions/import_map.json`

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
    "std/": "https://deno.land/std@0.168.0/"
  }
}
```

#### Script de Despliegue: `deploy_functions.sh`

```bash
#!/bin/bash
# Script para desplegar las Edge Functions de Supabase

echo "🚀 Desplegando Edge Functions..."

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "💡 Instala con: npm install -g supabase"
    exit 1
fi

# Verificar que estemos en el directorio correcto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ No se encontró supabase/config.toml"
    echo "💡 Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

# Desplegar funciones
echo "📦 Desplegando función TCG API..."
supabase functions deploy tcg-api --project-ref $SUPABASE_PROJECT_REF

echo "✅ Despliegue completado"
echo ""
echo "🔗 URLs de las funciones:"
echo "   TCG API: https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/tcg-api"
echo ""
echo "📚 Documentación de endpoints:"
echo "   GET  /api/games - Listar juegos"
echo "   GET  /api/games/{code} - Obtener juego específico"
echo "   GET  /api/sets - Listar sets"
echo "   GET  /api/cards - Listar cartas"
echo "   GET  /api/cards/{id} - Obtener carta específica"
echo "   GET  /api/prices - Obtener precios"
echo "   POST /api/search - Buscar cartas"
echo "   GET  /api/collections - Obtener colección del usuario"
echo "   POST /api/collections - Añadir a colección"
echo "   GET  /api/watchlists - Obtener watchlist del usuario"
echo "   POST /api/watchlists - Añadir a watchlist"
echo "   GET  /api/stats/prices - Estadísticas de precios"
echo "   GET  /api/stats/collection - Estadísticas de colección"
```

---

## 📋 Instrucciones de Instalación

### 1. Funciones SQL

1. **Abrir Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Navega a **SQL Editor**

2. **Ejecutar Funciones SQL**
   - Copia y pega cada bloque de funciones SQL en el orden mostrado
   - Ejecuta cada bloque por separado
   - Verifica que no haya errores

3. **Verificar Instalación**
   - Ve a **Database > Functions** en el dashboard
   - Deberías ver todas las funciones listadas

### 2. Edge Functions

1. **Preparar Archivos**
   - Crea la estructura de directorios: `supabase/functions/tcg-api/`
   - Copia el código TypeScript al archivo `index.ts`
   - Copia el `import_map.json` al directorio `supabase/functions/`

2. **Configurar Variables de Entorno**
   ```bash
   export SUPABASE_PROJECT_REF=tu-project-ref
   ```

3. **Desplegar**
   ```bash
   # Dar permisos de ejecución al script
   chmod +x deploy_functions.sh
   
   # Ejecutar despliegue
   ./deploy_functions.sh
   ```

### 3. Verificación

1. **Probar Funciones SQL**
   ```sql
   -- Probar función de búsqueda
   SELECT * FROM search_cards_with_prices('Black Lotus', 'mtg', 5);
   
   -- Probar función de estadísticas
   SELECT * FROM get_user_collection_stats('user-uuid-here');
   ```

2. **Probar Edge Functions**
   ```bash
   # Probar endpoint de juegos
   curl "https://tu-project-ref.supabase.co/functions/v1/tcg-api/api/games"
   
   # Probar búsqueda
   curl -X POST "https://tu-project-ref.supabase.co/functions/v1/tcg-api/api/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "Black Lotus", "game_code": "mtg"}'
   ```

---

## 🔧 Mantenimiento

### Actualizar Funciones SQL

1. Ejecuta `CREATE OR REPLACE FUNCTION` para actualizar funciones existentes
2. Las funciones se actualizarán automáticamente sin perder datos

### Actualizar Edge Functions

1. Modifica el código TypeScript
2. Ejecuta `supabase functions deploy tcg-api`
3. Los cambios se aplican inmediatamente

### Monitoreo

1. **Logs de Funciones SQL**: Ve a **Database > Logs** en Supabase Dashboard
2. **Logs de Edge Functions**: Ejecuta `supabase functions logs tcg-api`
3. **Métricas**: Ve a **Edge Functions > Metrics** en el dashboard

---

## 📚 Documentación Adicional

- [Documentación de Supabase Functions](https://supabase.com/docs/guides/functions)
- [Documentación de Edge Functions](https://supabase.com/docs/guides/functions/quickstart)
- [Guía de RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)

---

**¡Listo!** Tu sistema TCG Marketplace ahora tiene todas las funciones SQL y Edge Functions necesarias para operar completamente. 🚀 