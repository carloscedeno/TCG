-- =====================================================
-- FUNCIONES SQL PARA TCG MARKETPLACE - SUPABASE
-- VERSIÓN IDEMPOTENTE (SE PUEDE EJECUTAR MÚLTIPLES VECES)
-- =====================================================

-- 1. FUNCIÓN DE ACTUALIZACIÓN DE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS PARA TIMESTAMPS (IDEMPOTENTES)
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sets_updated_at ON sets;
CREATE TRIGGER update_sets_updated_at 
    BEFORE UPDATE ON sets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_card_printings_updated_at ON card_printings;
CREATE TRIGGER update_card_printings_updated_at 
    BEFORE UPDATE ON card_printings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sources_updated_at ON sources;
CREATE TRIGGER update_sources_updated_at 
    BEFORE UPDATE ON sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_collections_updated_at ON user_collections;
CREATE TRIGGER update_user_collections_updated_at 
    BEFORE UPDATE ON user_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_watchlist_updated_at ON user_watchlist;
CREATE TRIGGER update_user_watchlist_updated_at 
    BEFORE UPDATE ON user_watchlist 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. FUNCIÓN DE CÁLCULO DE PRECIOS AGREGADOS
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

DROP TRIGGER IF EXISTS trigger_calculate_aggregated_prices ON price_history;
CREATE TRIGGER trigger_calculate_aggregated_prices 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION calculate_aggregated_prices();

-- 3. FUNCIÓN DE NOTIFICACIONES DE CAMBIOS DE PRECIOS
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

DROP TRIGGER IF EXISTS notify_price_change_trigger ON price_history;
CREATE TRIGGER notify_price_change_trigger 
    AFTER INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION notify_price_change();

-- 4. FUNCIÓN DE VALIDACIÓN DE DATOS DE CARTAS
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

DROP TRIGGER IF EXISTS validate_card_data_trigger ON cards;
CREATE TRIGGER validate_card_data_trigger 
    BEFORE INSERT OR UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION validate_card_data();

-- 5. FUNCIÓN DE VALIDACIÓN DE PRECIOS
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

DROP TRIGGER IF EXISTS validate_price_data_trigger ON price_history;
CREATE TRIGGER validate_price_data_trigger 
    BEFORE INSERT OR UPDATE ON price_history 
    FOR EACH ROW EXECUTE FUNCTION validate_price_data();

-- 6. FUNCIÓN DE CÁLCULO DE TENDENCIAS DE PRECIOS
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

-- 7. FUNCIÓN DE ESTADÍSTICAS DE USUARIO
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

-- 8. FUNCIÓN DE LIMPIEZA DE DATOS ANTIGUOS
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

-- 9. FUNCIÓN DE BÚSQUEDA DE CARTAS CON PRECIOS
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

-- 10. FUNCIÓN DE OBTENCIÓN DE PRECIOS DE CARTA
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
    price_timestamp TIMESTAMPTZ
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

-- 11. FUNCIÓN DE VERIFICACIÓN DE ADMINISTRADOR
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

-- 12. FUNCIÓN DE VERIFICACIÓN DE SERVICIO
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

-- 13. FUNCIÓN DE OBTENCIÓN DEL ID DE USUARIO ACTUAL
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. FUNCIÓN DE AUDITORÍA DE CAMBIOS
CREATE OR REPLACE FUNCTION audit_user_collection_changes()
RETURNS TRIGGER AS $$
BEGIN
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

-- COMENTARIOS PARA DOCUMENTACIÓN (IDEMPOTENTES)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'update_updated_at_column()'::regprocedure) THEN
        COMMENT ON FUNCTION update_updated_at_column() IS 'Actualiza automáticamente el campo updated_at en todas las tablas';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'calculate_aggregated_prices()'::regprocedure) THEN
        COMMENT ON FUNCTION calculate_aggregated_prices() IS 'Calcula automáticamente los precios agregados cuando se actualiza el historial';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'validate_card_data()'::regprocedure) THEN
        COMMENT ON FUNCTION validate_card_data() IS 'Valida los datos de entrada para las cartas';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'validate_price_data()'::regprocedure) THEN
        COMMENT ON FUNCTION validate_price_data() IS 'Valida los datos de entrada para los precios';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'cleanup_old_data()'::regprocedure) THEN
        COMMENT ON FUNCTION cleanup_old_data() IS 'Limpia datos antiguos para mantener el rendimiento';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'get_user_collection_stats(uuid)'::regprocedure) THEN
        COMMENT ON FUNCTION get_user_collection_stats(UUID) IS 'Obtiene estadísticas de la colección de un usuario';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'notify_price_change()'::regprocedure) THEN
        COMMENT ON FUNCTION notify_price_change() IS 'Notifica cambios de precios para real-time subscriptions';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'calculate_price_trends(uuid,integer)'::regprocedure) THEN
        COMMENT ON FUNCTION calculate_price_trends(UUID, INTEGER) IS 'Calcula tendencias de precios para una impresión específica';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'is_admin()'::regprocedure) THEN
        COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario actual tiene rol de administrador';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'is_service()'::regprocedure) THEN
        COMMENT ON FUNCTION is_service() IS 'Verifica si el usuario actual tiene rol de servicio';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'current_user_id()'::regprocedure) THEN
        COMMENT ON FUNCTION current_user_id() IS 'Obtiene el ID del usuario actual';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_description WHERE objoid = 'audit_user_collection_changes()'::regprocedure) THEN
        COMMENT ON FUNCTION audit_user_collection_changes() IS 'Audita cambios en colecciones de usuario';
    END IF;
END $$; 