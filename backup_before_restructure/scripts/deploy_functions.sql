-- Script de despliegue automático de funciones SQL
-- Generado automáticamente por deploy_supabase_functions.py
-- Fecha: E:\TCG Web App

-- Función 1
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función 2
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

-- Función 3
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

-- Función 4
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

-- Función 5
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

-- Función 6
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

-- Función 7
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

-- Función 8
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

-- Función 9
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

-- Función 10
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

-- Función 11
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función 12
-- Crear triggers para actualización automática de timestamps
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

-- Función 13
-- Crear triggers para validación de datos
CREATE TRIGGER validate_card_data_trigger 
    BEFORE INSERT OR UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION validate_card_data();

CREATE TRIGGER validate_price_data_trigger 
    BEFORE INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION validate_price_data();

-- Función 14
-- Crear trigger para cálculo automático de precios agregados
CREATE TRIGGER trigger_calculate_aggregated_prices 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION calculate_aggregated_prices();

-- Trigger para notificaciones de cambios de precios
CREATE TRIGGER notify_price_change_trigger 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION notify_price_change();

-- Función 15
-- 1. Funciones de actualización
   -- Copiar y pegar: update_updated_at_column()
   -- Copiar y pegar: calculate_aggregated_prices()
   
   -- 2. Funciones de validación
   -- Copiar y pegar: validate_card_data()
   -- Copiar y pegar: validate_price_data()
   
   -- 3. Funciones de utilidad
   -- Copiar y pegar: cleanup_old_data()
   -- Copiar y pegar: get_user_collection_stats()
   
   -- 4. Funciones de notificación
   -- Copiar y pegar: notify_price_change()
   
   -- 5. Funciones de análisis
   -- Copiar y pegar: calculate_price_trends()
   
   -- 6. Funciones de seguridad
   -- Copiar y pegar: is_admin()
   -- Copiar y pegar: is_service()
   -- Copiar y pegar: current_user_id()
   
   -- 7. Triggers
   -- Copiar y pegar todos los triggers

-- Función 16
-- Probar función de estadísticas
SELECT * FROM get_user_collection_stats('user-uuid-here');

-- Probar función de tendencias
SELECT * FROM calculate_price_trends('printing-uuid-here', 30);

