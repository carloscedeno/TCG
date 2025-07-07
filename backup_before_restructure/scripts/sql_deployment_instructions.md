# Instrucciones para Desplegar Funciones SQL

## 📋 Pasos para Desplegar

### 1. Ir al SQL Editor de Supabase
- Abrir el dashboard de Supabase
- Ir a **SQL Editor**

### 2. Ejecutar las Funciones en Orden

#### Paso 1: Funciones de Actualización
```sql
-- Copiar y pegar esta función:
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

#### Paso 2: Función de Cálculo de Precios
```sql
-- Copiar y pegar esta función:
CREATE OR REPLACE FUNCTION calculate_aggregated_prices()
RETURNS TRIGGER AS $$
BEGIN
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
```

#### Paso 3: Funciones de Validación
```sql
-- Función de validación de cartas
CREATE OR REPLACE FUNCTION validate_card_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.card_name IS NULL OR LENGTH(TRIM(NEW.card_name)) = 0 THEN
        RAISE EXCEPTION 'El nombre de la carta no puede estar vacío';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM games WHERE game_id = NEW.game_id AND is_active = true) THEN
        RAISE EXCEPTION 'El juego especificado no existe o no está activo';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función de validación de precios
CREATE OR REPLACE FUNCTION validate_price_data()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.price_usd <= 0 THEN
        RAISE EXCEPTION 'El precio USD debe ser mayor a 0';
    END IF;
    
    IF NEW.price_eur IS NOT NULL AND NEW.price_eur <= 0 THEN
        RAISE EXCEPTION 'El precio EUR debe ser mayor a 0';
    END IF;
    
    IF NEW.stock_quantity IS NOT NULL AND NEW.stock_quantity < 0 THEN
        RAISE EXCEPTION 'La cantidad de stock no puede ser negativa';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';
```

#### Paso 4: Funciones de Utilidad
```sql
-- Función de limpieza de datos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    DELETE FROM price_history 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    UPDATE user_watchlist 
    SET is_active = false 
    WHERE updated_at < NOW() - INTERVAL '1 year' AND is_active = true;
    
    RAISE NOTICE 'Limpieza de datos antiguos completada: %', NOW();
END;
$$ language 'plpgsql';

-- Función de estadísticas de usuario
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

#### Paso 5: Funciones de Notificación y Análisis
```sql
-- Función de notificación de cambios
CREATE OR REPLACE FUNCTION notify_price_change()
RETURNS TRIGGER AS $$
BEGIN
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

-- Función de tendencias de precios
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

#### Paso 6: Funciones de Seguridad
```sql
-- Función para verificar admin
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

-- Función para verificar servicio
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

-- Función para obtener ID de usuario actual
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Paso 7: Crear Triggers
```sql
-- Triggers de actualización de timestamps
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

-- Triggers de validación
CREATE TRIGGER validate_card_data_trigger 
    BEFORE INSERT OR UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION validate_card_data();

CREATE TRIGGER validate_price_data_trigger 
    BEFORE INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION validate_price_data();

-- Triggers de cálculo automático
CREATE TRIGGER trigger_calculate_aggregated_prices 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION calculate_aggregated_prices();

CREATE TRIGGER notify_price_change_trigger 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION notify_price_change();
```

### 3. Verificar Despliegue

```sql
-- Verificar que las funciones se crearon correctamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Verificar triggers
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### 4. Probar Funciones

```sql
-- Probar función de estadísticas (reemplazar con UUID real)
SELECT * FROM get_user_collection_stats('00000000-0000-0000-0000-000000000000');

-- Probar función de tendencias (reemplazar con UUID real)
SELECT * FROM calculate_price_trends('00000000-0000-0000-0000-000000000000', 30);

-- Ejecutar limpieza de datos
SELECT cleanup_old_data();
```

## ✅ Verificación Final

1. ✅ Todas las funciones SQL están creadas
2. ✅ Todos los triggers están activos
3. ✅ Las funciones de validación están funcionando
4. ✅ Los cálculos automáticos están activos
5. ✅ Las notificaciones están configuradas

## 📚 Documentación Completa

Para más detalles, consulta: `docs/api/supabase_functions_complete.md`
