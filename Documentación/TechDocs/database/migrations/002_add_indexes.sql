-- Migración: Índices de rendimiento
-- Fecha: 2025-01-28
-- Descripción: Crear índices para optimizar el rendimiento de las consultas

-- Índices para búsqueda de cartas
CREATE INDEX idx_cards_game_name ON cards(game_id, card_name);
CREATE INDEX idx_cards_api_source ON cards(api_source_id);
CREATE INDEX idx_cards_game_active ON cards(game_id) WHERE game_id IN (SELECT game_id FROM games WHERE is_active = true);

-- Índices para búsqueda de impresiones
CREATE INDEX idx_printings_set_collector ON card_printings(set_id, collector_number);
CREATE INDEX idx_printings_api_source ON card_printings(api_source_id);
CREATE INDEX idx_printings_card_id ON card_printings(card_id);
CREATE INDEX idx_printings_foil ON card_printings(is_foil, is_etched);

-- Índices para historial de precios
CREATE INDEX idx_price_history_printing_time ON price_history(printing_id, timestamp DESC);
CREATE INDEX idx_price_history_source_time ON price_history(source_id, timestamp DESC);
CREATE INDEX idx_price_history_condition ON price_history(condition_id);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp DESC);
CREATE INDEX idx_price_history_printing_condition ON price_history(printing_id, condition_id, timestamp DESC);

-- Índices para precios agregados
CREATE INDEX idx_aggregated_prices_updated ON aggregated_prices(last_updated DESC);
CREATE INDEX idx_aggregated_prices_lookup ON aggregated_prices(printing_id, condition_id);
CREATE INDEX idx_aggregated_prices_price_range ON aggregated_prices(avg_market_price_usd) WHERE avg_market_price_usd > 0;

-- Índices para colecciones de usuario
CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_printing ON user_collections(printing_id);
CREATE INDEX idx_user_collections_condition ON user_collections(condition_id);
CREATE INDEX idx_user_collections_user_condition ON user_collections(user_id, condition_id);

-- Índices para watchlist
CREATE INDEX idx_user_watchlist_user ON user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_printing ON user_watchlist(printing_id);
CREATE INDEX idx_user_watchlist_active ON user_watchlist(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_watchlist_target_price ON user_watchlist(target_price_usd) WHERE target_price_usd IS NOT NULL;

-- Índices para sets
CREATE INDEX idx_sets_game ON sets(game_id);
CREATE INDEX idx_sets_release_date ON sets(release_date DESC);
CREATE INDEX idx_sets_code ON sets(set_code);

-- Índices para fuentes
CREATE INDEX idx_sources_active ON sources(source_id) WHERE is_active = true;

-- Índices para condiciones
CREATE INDEX idx_conditions_sort_order ON conditions(sort_order);

-- Índices compuestos para consultas complejas
CREATE INDEX idx_cards_search ON cards(game_id, card_name) WHERE is_active = true;
CREATE INDEX idx_printings_search ON card_printings(set_id, collector_number, is_foil);
CREATE INDEX idx_price_history_daily ON price_history(printing_id, DATE(timestamp), source_id);

-- Índices para consultas de análisis
CREATE INDEX idx_price_history_analysis ON price_history(printing_id, condition_id, source_id, timestamp DESC);
CREATE INDEX idx_user_collections_analysis ON user_collections(user_id, printing_id, condition_id, purchase_date);

-- Comentarios para documentación
COMMENT ON INDEX idx_cards_game_name IS 'Optimiza búsquedas de cartas por juego y nombre';
COMMENT ON INDEX idx_printings_set_collector IS 'Optimiza búsquedas de impresiones por set y número de coleccionista';
COMMENT ON INDEX idx_price_history_printing_time IS 'Optimiza consultas de historial de precios por impresión y tiempo';
COMMENT ON INDEX idx_user_collections_user IS 'Optimiza consultas de colecciones por usuario';
COMMENT ON INDEX idx_user_watchlist_active IS 'Optimiza consultas de watchlist activo por usuario'; 