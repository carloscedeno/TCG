-- Migración: Row Level Security (RLS)
-- Fecha: 2025-01-28
-- Descripción: Configurar políticas de seguridad a nivel de fila para proteger datos de usuario

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

-- Políticas para acceso público a datos de cartas (solo lectura)
CREATE POLICY "Public read access to games" ON games
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to sets" ON sets
    FOR SELECT USING (true);

CREATE POLICY "Public read access to cards" ON cards
    FOR SELECT USING (true);

CREATE POLICY "Public read access to card_printings" ON card_printings
    FOR SELECT USING (true);

CREATE POLICY "Public read access to conditions" ON conditions
    FOR SELECT USING (true);

CREATE POLICY "Public read access to sources" ON sources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to price_history" ON price_history
    FOR SELECT USING (true);

CREATE POLICY "Public read access to aggregated_prices" ON aggregated_prices
    FOR SELECT USING (true);

-- Políticas para administradores (solo para operaciones de mantenimiento)
-- Nota: Estas políticas requieren que el usuario tenga el rol 'admin'
CREATE POLICY "Admin full access to games" ON games
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to sets" ON sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to cards" ON cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to card_printings" ON card_printings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to price_history" ON price_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admin full access to aggregated_prices" ON aggregated_prices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Políticas para servicios de actualización de precios
-- Nota: Estas políticas permiten que los servicios de backend actualicen precios
CREATE POLICY "Service can update price_history" ON price_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' IN ('admin', 'service')
        )
    );

CREATE POLICY "Service can update aggregated_prices" ON aggregated_prices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' IN ('admin', 'service')
        )
    );

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

-- Función para obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas más específicas para colecciones de usuario
CREATE POLICY "Users can view collection with card details" ON user_collections
    FOR SELECT USING (
        auth.uid() = user_id
        OR is_admin()
    );

-- Políticas para watchlist con validaciones adicionales
CREATE POLICY "Users can manage active watchlist items" ON user_watchlist
    FOR ALL USING (
        auth.uid() = user_id
        AND is_active = true
    );

-- Políticas para datos de precios con restricciones de tiempo
CREATE POLICY "Recent price data access" ON price_history
    FOR SELECT USING (
        timestamp >= NOW() - INTERVAL '2 years'
    );

-- Políticas para datos agregados con restricciones de actualización
CREATE POLICY "Aggregated prices read access" ON aggregated_prices
    FOR SELECT USING (
        last_updated >= NOW() - INTERVAL '30 days'
    );

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

-- Trigger para auditar cambios en colecciones (opcional)
-- CREATE TRIGGER audit_user_collection_changes_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON user_collections
--     FOR EACH ROW EXECUTE FUNCTION audit_user_collection_changes();

-- Políticas para acceso a datos de análisis (solo para usuarios autenticados)
CREATE POLICY "Authenticated users can view analytics" ON aggregated_prices
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- Políticas para acceso a datos históricos (con restricciones)
CREATE POLICY "Limited historical data access" ON price_history
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND timestamp >= NOW() - INTERVAL '1 year'
    );

-- Comentarios para documentación
COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario actual tiene rol de administrador';
COMMENT ON FUNCTION is_service() IS 'Verifica si el usuario actual tiene rol de servicio';
COMMENT ON FUNCTION current_user_id() IS 'Obtiene el ID del usuario actual';
COMMENT ON FUNCTION audit_user_collection_changes() IS 'Audita cambios en colecciones de usuario';

-- Configuración adicional de seguridad
-- Deshabilitar acceso anónimo a tablas sensibles
ALTER TABLE user_collections FORCE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist FORCE ROW LEVEL SECURITY;

-- Configurar políticas de rate limiting (a nivel de aplicación)
-- Nota: Esto se implementa en el nivel de aplicación, no en la base de datos 