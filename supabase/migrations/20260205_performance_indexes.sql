-- Performance Optimization: Database Indexes
-- PRD: PRD_PERFORMANCE.md
-- Date: 2026-02-05
-- Expected Impact: 40-60% improvement in search queries

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for card name searches (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_cards_name_trgm 
ON cards USING gin(card_name gin_trgm_ops);

-- Index for game_id filtering (frequent filter)
CREATE INDEX IF NOT EXISTS idx_cards_game_id 
ON cards(game_id) WHERE game_id IS NOT NULL;

-- Index for rarity filtering (frequent filter)
CREATE INDEX IF NOT EXISTS idx_cards_rarity 
ON cards(rarity) WHERE rarity IS NOT NULL;

-- Composite index for common query patterns (game + rarity)
CREATE INDEX IF NOT EXISTS idx_cards_game_rarity 
ON cards(game_id, rarity);

-- Index for set release_date (sorting)
CREATE INDEX IF NOT EXISTS idx_sets_release_date 
ON sets(release_date DESC);

-- Index for card_printings joins (frequent join)
CREATE INDEX IF NOT EXISTS idx_printings_card_id 
ON card_printings(card_id);

-- Index for printing_id lookups in aggregated_prices
CREATE INDEX IF NOT EXISTS idx_aggregated_prices_printing_id
ON aggregated_prices(printing_id);

-- Index for printing_id lookups in products
CREATE INDEX IF NOT EXISTS idx_products_printing_id
ON products(printing_id);

-- Analyze tables to update statistics
ANALYZE cards;
ANALYZE card_printings;
ANALYZE sets;
ANALYZE aggregated_prices;
ANALYZE products;
