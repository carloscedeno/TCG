-- Migración: Índices optimizados para múltiples TCG
-- Fecha: 2025-01-28
-- Descripción: Crear índices para optimizar consultas en el sistema multi-TCG

-- Índices principales para búsqueda de cartas
CREATE INDEX IF NOT EXISTS idx_cards_game_name ON cards(game_id, card_name);
CREATE INDEX IF NOT EXISTS idx_cards_type_line ON cards USING gin(to_tsvector('english', type_line));
CREATE INDEX IF NOT EXISTS idx_cards_oracle_text ON cards USING gin(to_tsvector('english', oracle_text));
CREATE INDEX IF NOT EXISTS idx_cards_tcg_attributes ON cards USING gin(tcg_specific_attributes);

-- Índices para campos específicos por TCG
CREATE INDEX IF NOT EXISTS idx_cards_hp ON cards(hp) WHERE hp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_level ON cards(level) WHERE level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_color ON cards(color) WHERE color IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_attribute ON cards(attribute) WHERE attribute IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_loyalty ON cards(loyalty) WHERE loyalty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_defense ON cards(defense) WHERE defense IS NOT NULL;

-- Índices para impresiones
CREATE INDEX IF NOT EXISTS idx_printings_set_collector ON card_printings(set_id, collector_number);
CREATE INDEX IF NOT EXISTS idx_printings_rarity ON card_printings(rarity);
CREATE INDEX IF NOT EXISTS idx_printings_foil ON card_printings(is_foil);
CREATE INDEX IF NOT EXISTS idx_printings_alt_art ON card_printings(is_alt_art);
CREATE INDEX IF NOT EXISTS idx_printings_first_edition ON card_printings(is_first_edition);
CREATE INDEX IF NOT EXISTS idx_printings_full_art ON card_printings(is_full_art);
CREATE INDEX IF NOT EXISTS idx_printings_tcg_attributes ON card_printings USING gin(tcg_specific_printing_attributes);

-- Índices para búsqueda de artistas
CREATE INDEX IF NOT EXISTS idx_printings_artist ON card_printings(artist) WHERE artist IS NOT NULL;

-- Índices para historial de precios
CREATE INDEX IF NOT EXISTS idx_price_history_printing_time ON price_history(printing_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_source_condition ON price_history(source_id, condition_id);
CREATE INDEX IF NOT EXISTS idx_price_history_price_type ON price_history(price_type);
CREATE INDEX IF NOT EXISTS idx_price_history_foil_etched ON price_history(is_foil, is_etched);
CREATE INDEX IF NOT EXISTS idx_pricehistory_date_only ON price_history (date_only);

-- Índices para precios agregados
CREATE INDEX IF NOT EXISTS idx_aggregated_prices_lookup ON aggregated_prices(printing_id, condition_id);
CREATE INDEX IF NOT EXISTS idx_aggregated_prices_market ON aggregated_prices(avg_market_price_usd) WHERE avg_market_price_usd IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aggregated_prices_last_updated ON aggregated_prices(last_updated);

-- Índices para colecciones de usuario
CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_printing ON user_collections(printing_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_condition ON user_collections(condition_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_for_trade ON user_collections(is_for_trade) WHERE is_for_trade = true;
CREATE INDEX IF NOT EXISTS idx_user_collections_for_sale ON user_collections(is_for_sale) WHERE is_for_sale = true;

-- Índices para watchlist
CREATE INDEX IF NOT EXISTS idx_user_watchlist_lookup ON user_watchlist(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_printing ON user_watchlist(printing_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_target_price ON user_watchlist(target_price_usd) WHERE target_price_usd IS NOT NULL;

-- Índices para atributos específicos por TCG
CREATE INDEX IF NOT EXISTS idx_card_attributes_game ON card_attributes(game_id);
CREATE INDEX IF NOT EXISTS idx_card_attributes_name ON card_attributes(attribute_name);
CREATE INDEX IF NOT EXISTS idx_card_attributes_type ON card_attributes(attribute_type);

-- Índices para tipos de cartas
CREATE INDEX IF NOT EXISTS idx_card_types_game ON card_types(game_id);
CREATE INDEX IF NOT EXISTS idx_card_types_category ON card_types(type_category);
CREATE INDEX IF NOT EXISTS idx_card_types_name ON card_types(type_name);

-- Índices para legalidades
CREATE INDEX IF NOT EXISTS idx_card_legalities_printing ON card_legalities(printing_id);
CREATE INDEX IF NOT EXISTS idx_card_legalities_format ON card_legalities(format_name);
CREATE INDEX IF NOT EXISTS idx_card_legalities_status ON card_legalities(legality_status);
CREATE INDEX IF NOT EXISTS idx_card_legalities_effective_date ON card_legalities(effective_date);

-- Índices para identificadores externos
CREATE INDEX IF NOT EXISTS idx_external_identifiers_printing ON external_identifiers(printing_id);
CREATE INDEX IF NOT EXISTS idx_external_identifiers_source ON external_identifiers(source_id);
CREATE INDEX IF NOT EXISTS idx_external_identifiers_type ON external_identifiers(identifier_type);
CREATE INDEX IF NOT EXISTS idx_external_identifiers_external_id ON external_identifiers(external_id);

-- Índices para imágenes
CREATE INDEX IF NOT EXISTS idx_card_images_printing ON card_images(printing_id);
CREATE INDEX IF NOT EXISTS idx_card_images_type ON card_images(image_type);
CREATE INDEX IF NOT EXISTS idx_card_images_primary ON card_images(is_primary) WHERE is_primary = true;

-- Índices compuestos para consultas complejas
CREATE INDEX IF NOT EXISTS idx_cards_game_rarity ON cards(game_id, base_rarity);
CREATE INDEX IF NOT EXISTS idx_printings_set_rarity ON card_printings(set_id, rarity);
CREATE INDEX IF NOT EXISTS idx_price_history_printing_condition_time ON price_history(printing_id, condition_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_collections_user_condition ON user_collections(user_id, condition_id);

-- Índices para búsqueda de texto completo
CREATE INDEX IF NOT EXISTS idx_cards_full_text_search ON cards USING gin(
    to_tsvector('english', 
        coalesce(card_name, '') || ' ' || 
        coalesce(type_line, '') || ' ' || 
        coalesce(oracle_text, '')
    )
);

-- Índices para consultas de precios por rango
CREATE INDEX IF NOT EXISTS idx_price_history_price_range ON price_history(price_usd) WHERE price_usd > 0;
CREATE INDEX IF NOT EXISTS idx_aggregated_prices_range ON aggregated_prices(avg_market_price_usd) WHERE avg_market_price_usd > 0;

-- Índices para consultas temporales
CREATE INDEX IF NOT EXISTS idx_price_history_recent ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_aggregated_prices_recent ON aggregated_prices(last_updated);

-- Comentarios para documentación
COMMENT ON INDEX idx_cards_game_name IS 'Optimiza búsquedas de cartas por juego y nombre';
COMMENT ON INDEX idx_cards_tcg_attributes IS 'Optimiza consultas en atributos específicos por TCG (JSON)';
COMMENT ON INDEX idx_price_history_printing_time IS 'Optimiza consultas de historial de precios por impresión y tiempo';
COMMENT ON INDEX idx_user_collections_user IS 'Optimiza consultas de colecciones por usuario';
COMMENT ON INDEX idx_external_identifiers_external_id IS 'Optimiza mapeo entre identificadores externos';
COMMENT ON INDEX idx_cards_full_text_search IS 'Optimiza búsquedas de texto completo en cartas';

-- Ejemplo de restricción UNIQUE por fecha (opcional):
-- ALTER TABLE price_history ADD CONSTRAINT unique_price_per_day UNIQUE (printing_id, source_id, condition_id, price_type, is_foil, is_etched, date_only); 