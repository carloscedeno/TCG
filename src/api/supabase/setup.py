#!/usr/bin/env python3
"""
Script para configurar Supabase con todas las tablas, funciones y APIs necesarias
para el sistema TCG Price Aggregator
"""

import os
import json
from typing import Dict, List, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class SupabaseSetup:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
    def create_database_schema(self):
        """Crear el esquema completo de la base de datos"""
        print("🗄️ Creando esquema de base de datos...")
        
        # SQL para crear todas las tablas
        schema_sql = """
        -- Habilitar extensiones necesarias
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pg_trgm";
        
        -- 1. Tabla de juegos
        CREATE TABLE IF NOT EXISTS games (
            game_id SERIAL PRIMARY KEY,
            game_name VARCHAR(100) NOT NULL UNIQUE,
            game_code VARCHAR(10) NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 2. Tabla de sets/ediciones
        CREATE TABLE IF NOT EXISTS sets (
            set_id SERIAL PRIMARY KEY,
            game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
            set_name VARCHAR(200) NOT NULL,
            set_code VARCHAR(20) NOT NULL,
            release_date DATE,
            total_cards INTEGER,
            is_digital BOOLEAN DEFAULT false,
            is_promo BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(game_id, set_code)
        );
        
        -- 3. Tabla de cartas (datos lógicos)
        CREATE TABLE IF NOT EXISTS cards (
            card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
            card_name VARCHAR(200) NOT NULL,
            type_line VARCHAR(300),
            oracle_text TEXT,
            mana_cost VARCHAR(50),
            power VARCHAR(10),
            toughness VARCHAR(10),
            base_rarity VARCHAR(50),
            hp INTEGER,
            level INTEGER,
            color VARCHAR(50),
            attribute VARCHAR(50),
            loyalty INTEGER,
            defense INTEGER,
            tcg_specific_attributes JSONB,
            api_source_id VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(game_id, card_name)
        );
        
        -- 4. Tabla de impresiones (versiones físicas)
        CREATE TABLE IF NOT EXISTS card_printings (
            printing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            card_id UUID REFERENCES cards(card_id) ON DELETE CASCADE,
            set_id INTEGER REFERENCES sets(set_id) ON DELETE CASCADE,
            collector_number VARCHAR(20),
            rarity VARCHAR(50),
            is_foil BOOLEAN DEFAULT false,
            is_non_foil BOOLEAN DEFAULT true,
            is_etched BOOLEAN DEFAULT false,
            is_alt_art BOOLEAN DEFAULT false,
            is_first_edition BOOLEAN DEFAULT false,
            artist VARCHAR(200),
            image_url_small VARCHAR(500),
            image_url_normal VARCHAR(500),
            image_url_large VARCHAR(500),
            tcg_specific_printing_attributes JSONB,
            api_source_id VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(set_id, collector_number, is_foil, is_etched)
        );
        
        -- 5. Tabla de condiciones
        CREATE TABLE IF NOT EXISTS conditions (
            condition_id SERIAL PRIMARY KEY,
            condition_name VARCHAR(50) NOT NULL UNIQUE,
            condition_code VARCHAR(10) NOT NULL UNIQUE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 6. Tabla de fuentes
        CREATE TABLE IF NOT EXISTS sources (
            source_id SERIAL PRIMARY KEY,
            source_name VARCHAR(100) NOT NULL UNIQUE,
            source_code VARCHAR(20) NOT NULL UNIQUE,
            website_url VARCHAR(200),
            logo_url VARCHAR(500),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 7. Tabla de historial de precios
        CREATE TABLE IF NOT EXISTS price_history (
            price_entry_id BIGSERIAL PRIMARY KEY,
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            source_id INTEGER REFERENCES sources(source_id) ON DELETE CASCADE,
            condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
            price_usd DECIMAL(10, 2) NOT NULL,
            price_eur DECIMAL(10, 2),
            stock_quantity INTEGER,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            price_type VARCHAR(20) DEFAULT 'market',
            is_foil BOOLEAN DEFAULT false,
            is_etched BOOLEAN DEFAULT false,
            UNIQUE(printing_id, source_id, condition_id, DATE(timestamp))
        );
        
        -- 8. Tabla de precios agregados (caché)
        CREATE TABLE IF NOT EXISTS aggregated_prices (
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
            avg_market_price_usd DECIMAL(10, 2),
            low_price_usd DECIMAL(10, 2),
            high_price_usd DECIMAL(10, 2),
            price_count INTEGER DEFAULT 0,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (printing_id, condition_id)
        );
        
        -- 9. Tabla de atributos de cartas
        CREATE TABLE IF NOT EXISTS card_attributes (
            attribute_id SERIAL PRIMARY KEY,
            game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
            attribute_name VARCHAR(100) NOT NULL,
            attribute_type VARCHAR(50) NOT NULL,
            description TEXT,
            is_required BOOLEAN DEFAULT false,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 10. Tabla de tipos de cartas
        CREATE TABLE IF NOT EXISTS card_types (
            type_id SERIAL PRIMARY KEY,
            game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
            type_name VARCHAR(100) NOT NULL,
            type_category VARCHAR(50),
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 11. Tabla de legalidades
        CREATE TABLE IF NOT EXISTS legalities (
            legality_id SERIAL PRIMARY KEY,
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            format_name VARCHAR(50) NOT NULL,
            legality_status VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(printing_id, format_name)
        );
        
        -- 12. Tabla de identificadores externos
        CREATE TABLE IF NOT EXISTS external_identifiers (
            identifier_id SERIAL PRIMARY KEY,
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            identifier_type VARCHAR(50) NOT NULL,
            identifier_value VARCHAR(200) NOT NULL,
            source VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(identifier_type, identifier_value, source)
        );
        
        -- 13. Tabla de imágenes de cartas
        CREATE TABLE IF NOT EXISTS card_images (
            image_id SERIAL PRIMARY KEY,
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            image_type VARCHAR(20) NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            image_width INTEGER,
            image_height INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 14. Tabla de colecciones de usuario
        CREATE TABLE IF NOT EXISTS user_collections (
            collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            quantity INTEGER DEFAULT 1,
            condition_id INTEGER REFERENCES conditions(condition_id),
            is_foil BOOLEAN DEFAULT false,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, printing_id, condition_id, is_foil)
        );
        
        -- 15. Tabla de watchlists
        CREATE TABLE IF NOT EXISTS user_watchlists (
            watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
            target_price_usd DECIMAL(10, 2),
            target_price_eur DECIMAL(10, 2),
            alert_type VARCHAR(20) DEFAULT 'price_drop',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, printing_id)
        );
        """
        
        try:
            # Ejecutar el SQL del esquema
            result = self.supabase.rpc('exec_sql', {'sql': schema_sql}).execute()
            print("✅ Esquema de base de datos creado exitosamente")
        except Exception as e:
            print(f"⚠️ Error creando esquema: {e}")
            # Intentar crear las tablas una por una
            self.create_tables_individually()
    
    def create_tables_individually(self):
        """Crear tablas individualmente en caso de error"""
        print("🔧 Creando tablas individualmente...")
        
        # Crear cada tabla por separado
        tables_sql = [
            # Games
            """
            CREATE TABLE IF NOT EXISTS games (
                game_id SERIAL PRIMARY KEY,
                game_name VARCHAR(100) NOT NULL UNIQUE,
                game_code VARCHAR(10) NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            """,
            
            # Sets
            """
            CREATE TABLE IF NOT EXISTS sets (
                set_id SERIAL PRIMARY KEY,
                game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
                set_name VARCHAR(200) NOT NULL,
                set_code VARCHAR(20) NOT NULL,
                release_date DATE,
                total_cards INTEGER,
                is_digital BOOLEAN DEFAULT false,
                is_promo BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(game_id, set_code)
            );
            """,
            
            # Cards
            """
            CREATE TABLE IF NOT EXISTS cards (
                card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                game_id INTEGER REFERENCES games(game_id) ON DELETE CASCADE,
                card_name VARCHAR(200) NOT NULL,
                type_line VARCHAR(300),
                oracle_text TEXT,
                mana_cost VARCHAR(50),
                power VARCHAR(10),
                toughness VARCHAR(10),
                base_rarity VARCHAR(50),
                hp INTEGER,
                level INTEGER,
                color VARCHAR(50),
                attribute VARCHAR(50),
                loyalty INTEGER,
                defense INTEGER,
                tcg_specific_attributes JSONB,
                api_source_id VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(game_id, card_name)
            );
            """,
            
            # Card Printings
            """
            CREATE TABLE IF NOT EXISTS card_printings (
                printing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                card_id UUID REFERENCES cards(card_id) ON DELETE CASCADE,
                set_id INTEGER REFERENCES sets(set_id) ON DELETE CASCADE,
                collector_number VARCHAR(20),
                rarity VARCHAR(50),
                is_foil BOOLEAN DEFAULT false,
                is_non_foil BOOLEAN DEFAULT true,
                is_etched BOOLEAN DEFAULT false,
                is_alt_art BOOLEAN DEFAULT false,
                is_first_edition BOOLEAN DEFAULT false,
                artist VARCHAR(200),
                image_url_small VARCHAR(500),
                image_url_normal VARCHAR(500),
                image_url_large VARCHAR(500),
                tcg_specific_printing_attributes JSONB,
                api_source_id VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(set_id, collector_number, is_foil, is_etched)
            );
            """,
            
            # Conditions
            """
            CREATE TABLE IF NOT EXISTS conditions (
                condition_id SERIAL PRIMARY KEY,
                condition_name VARCHAR(50) NOT NULL UNIQUE,
                condition_code VARCHAR(10) NOT NULL UNIQUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            """,
            
            # Sources
            """
            CREATE TABLE IF NOT EXISTS sources (
                source_id SERIAL PRIMARY KEY,
                source_name VARCHAR(100) NOT NULL UNIQUE,
                source_code VARCHAR(20) NOT NULL UNIQUE,
                website_url VARCHAR(200),
                logo_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            """,
            
            # Price History
            """
            CREATE TABLE IF NOT EXISTS price_history (
                price_entry_id BIGSERIAL PRIMARY KEY,
                printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
                source_id INTEGER REFERENCES sources(source_id) ON DELETE CASCADE,
                condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
                price_usd DECIMAL(10, 2) NOT NULL,
                price_eur DECIMAL(10, 2),
                stock_quantity INTEGER,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                price_type VARCHAR(20) DEFAULT 'market',
                is_foil BOOLEAN DEFAULT false,
                is_etched BOOLEAN DEFAULT false,
                UNIQUE(printing_id, source_id, condition_id, DATE(timestamp))
            );
            """,
            
            # Aggregated Prices
            """
            CREATE TABLE IF NOT EXISTS aggregated_prices (
                printing_id UUID REFERENCES card_printings(printing_id) ON DELETE CASCADE,
                condition_id INTEGER REFERENCES conditions(condition_id) ON DELETE CASCADE,
                avg_market_price_usd DECIMAL(10, 2),
                low_price_usd DECIMAL(10, 2),
                high_price_usd DECIMAL(10, 2),
                price_count INTEGER DEFAULT 0,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (printing_id, condition_id)
            );
            """
        ]
        
        for i, sql in enumerate(tables_sql):
            try:
                self.supabase.rpc('exec_sql', {'sql': sql}).execute()
                print(f"✅ Tabla {i+1} creada exitosamente")
            except Exception as e:
                print(f"❌ Error creando tabla {i+1}: {e}")
    
    def insert_initial_data(self):
        """Insertar datos iniciales necesarios"""
        print("📝 Insertando datos iniciales...")
        
        # Insertar juegos
        games_data = [
            {'game_name': 'Magic: The Gathering', 'game_code': 'MTG', 'description': 'El primer y más complejo TCG'},
            {'game_name': 'Pokémon', 'game_code': 'POKEMON', 'description': 'Juego basado en la franquicia Pokémon'},
            {'game_name': 'Lorcana', 'game_code': 'LORCANA', 'description': 'Juego de Disney con mecánicas de tinta'},
            {'game_name': 'Flesh and Blood', 'game_code': 'FAB', 'description': 'Juego competitivo con pitch'},
            {'game_name': 'Yu-Gi-Oh!', 'game_code': 'YUGIOH', 'description': 'Juego japonés con múltiples tipos de monstruos'},
            {'game_name': 'Wixoss', 'game_code': 'WIXOSS', 'description': 'Juego japonés con mazos duales'},
            {'game_name': 'One Piece', 'game_code': 'ONEPIECE', 'description': 'Juego basado en el anime One Piece'}
        ]
        
        for game in games_data:
            try:
                self.supabase.table('games').upsert(game).execute()
                print(f"✅ Juego {game['game_name']} insertado")
            except Exception as e:
                print(f"⚠️ Error insertando juego {game['game_name']}: {e}")
        
        # Insertar condiciones
        conditions_data = [
            {'condition_name': 'Near Mint', 'condition_code': 'NM', 'sort_order': 1},
            {'condition_name': 'Lightly Played', 'condition_code': 'LP', 'sort_order': 2},
            {'condition_name': 'Moderately Played', 'condition_code': 'MP', 'sort_order': 3},
            {'condition_name': 'Heavily Played', 'condition_code': 'HP', 'sort_order': 4},
            {'condition_name': 'Damaged', 'condition_code': 'DM', 'sort_order': 5}
        ]
        
        for condition in conditions_data:
            try:
                self.supabase.table('conditions').upsert(condition).execute()
                print(f"✅ Condición {condition['condition_name']} insertada")
            except Exception as e:
                print(f"⚠️ Error insertando condición {condition['condition_name']}: {e}")
        
        # Insertar fuentes
        sources_data = [
            {'source_name': 'TCGplayer', 'source_code': 'TCGPLAYER', 'website_url': 'https://www.tcgplayer.com'},
            {'source_name': 'Card Kingdom', 'source_code': 'CARDKINGDOM', 'website_url': 'https://www.cardkingdom.com'},
            {'source_name': 'Cardmarket', 'source_code': 'CARDMARKET', 'website_url': 'https://www.cardmarket.com'},
            {'source_name': 'Troll and Toad', 'source_code': 'TROLLANDTOAD', 'website_url': 'https://www.trollandtoad.com'}
        ]
        
        for source in sources_data:
            try:
                self.supabase.table('sources').upsert(source).execute()
                print(f"✅ Fuente {source['source_name']} insertada")
            except Exception as e:
                print(f"⚠️ Error insertando fuente {source['source_name']}: {e}")
    
    def create_indexes(self):
        """Crear índices para optimizar consultas"""
        print("🔍 Creando índices...")
        
        indexes_sql = """
        -- Índices para búsqueda de cartas
        CREATE INDEX IF NOT EXISTS idx_cards_game_name ON cards(game_id, card_name);
        CREATE INDEX IF NOT EXISTS idx_cards_api_source_id ON cards(api_source_id) WHERE api_source_id IS NOT NULL;
        
        -- Índices para búsqueda de texto completo
        CREATE INDEX IF NOT EXISTS idx_cards_name_gin ON cards USING gin(card_name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS idx_cards_type_line_gin ON cards USING gin(type_line gin_trgm_ops);
        
        -- Índices para atributos específicos
        CREATE INDEX IF NOT EXISTS idx_cards_hp ON cards(hp) WHERE hp IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_cards_level ON cards(level) WHERE level IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_cards_color ON cards(color) WHERE color IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_cards_attribute ON cards(attribute) WHERE attribute IS NOT NULL;
        
        -- Índices para impresiones
        CREATE INDEX IF NOT EXISTS idx_printings_card_set ON card_printings(card_id, set_id);
        CREATE INDEX IF NOT EXISTS idx_printings_collector_number ON card_printings(set_id, collector_number);
        CREATE INDEX IF NOT EXISTS idx_printings_api_source_id ON card_printings(api_source_id) WHERE api_source_id IS NOT NULL;
        
        -- Índices para precios
        CREATE INDEX IF NOT EXISTS idx_price_history_printing_time ON price_history(printing_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_price_history_source_condition ON price_history(source_id, condition_id);
        CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
        
        -- Índices para precios agregados
        CREATE INDEX IF NOT EXISTS idx_aggregated_prices_lookup ON aggregated_prices(printing_id, condition_id);
        CREATE INDEX IF NOT EXISTS idx_aggregated_prices_updated ON aggregated_prices(last_updated DESC);
        
        -- Índices para sets
        CREATE INDEX IF NOT EXISTS idx_sets_game_code ON sets(game_id, set_code);
        CREATE INDEX IF NOT EXISTS idx_sets_release_date ON sets(release_date DESC);
        
        -- Índices para colecciones de usuario
        CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_collections_printing ON user_collections(printing_id);
        
        -- Índices para watchlists
        CREATE INDEX IF NOT EXISTS idx_watchlists_user ON user_watchlists(user_id);
        CREATE INDEX IF NOT EXISTS idx_watchlists_printing ON user_watchlists(printing_id);
        """
        
        try:
            self.supabase.rpc('exec_sql', {'sql': indexes_sql}).execute()
            print("✅ Índices creados exitosamente")
        except Exception as e:
            print(f"⚠️ Error creando índices: {e}")
    
    def create_functions(self):
        """Crear funciones SQL para operaciones comunes"""
        print("⚙️ Creando funciones SQL...")
        
        functions_sql = """
        -- Función para actualizar precios agregados
        CREATE OR REPLACE FUNCTION update_aggregated_prices()
        RETURNS void AS $$
        BEGIN
            INSERT INTO aggregated_prices (printing_id, condition_id, avg_market_price_usd, low_price_usd, high_price_usd, price_count, last_updated)
            SELECT 
                ph.printing_id,
                ph.condition_id,
                AVG(ph.price_usd) as avg_market_price_usd,
                MIN(ph.price_usd) as low_price_usd,
                MAX(ph.price_usd) as high_price_usd,
                COUNT(*) as price_count,
                NOW() as last_updated
            FROM price_history ph
            WHERE ph.timestamp > NOW() - INTERVAL '7 days'
            GROUP BY ph.printing_id, ph.condition_id
            ON CONFLICT (printing_id, condition_id) 
            DO UPDATE SET
                avg_market_price_usd = EXCLUDED.avg_market_price_usd,
                low_price_usd = EXCLUDED.low_price_usd,
                high_price_usd = EXCLUDED.high_price_usd,
                price_count = EXCLUDED.price_count,
                last_updated = EXCLUDED.last_updated;
        END;
        $$ LANGUAGE plpgsql;
        
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
        """
        
        try:
            self.supabase.rpc('exec_sql', {'sql': functions_sql}).execute()
            print("✅ Funciones SQL creadas exitosamente")
        except Exception as e:
            print(f"⚠️ Error creando funciones: {e}")
    
    def setup_rls_policies(self):
        """Configurar Row Level Security (RLS)"""
        print("🔒 Configurando políticas de seguridad...")
        
        rls_sql = """
        -- Habilitar RLS en tablas de usuario
        ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
        
        -- Políticas para user_collections
        CREATE POLICY "Users can view their own collections"
        ON user_collections FOR SELECT
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own collections"
        ON user_collections FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own collections"
        ON user_collections FOR UPDATE
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own collections"
        ON user_collections FOR DELETE
        USING (auth.uid() = user_id);
        
        -- Políticas para user_watchlists
        CREATE POLICY "Users can view their own watchlists"
        ON user_watchlists FOR SELECT
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own watchlists"
        ON user_watchlists FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own watchlists"
        ON user_watchlists FOR UPDATE
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own watchlists"
        ON user_watchlists FOR DELETE
        USING (auth.uid() = user_id);
        """
        
        try:
            self.supabase.rpc('exec_sql', {'sql': rls_sql}).execute()
            print("✅ Políticas de seguridad configuradas")
        except Exception as e:
            print(f"⚠️ Error configurando políticas: {e}")
    
    def create_triggers(self):
        """Crear triggers para mantener datos actualizados"""
        print("🔧 Creando triggers...")
        
        triggers_sql = """
        -- Trigger para actualizar updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- Aplicar trigger a tablas que lo necesitan
        CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_card_printings_updated_at BEFORE UPDATE ON card_printings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_user_collections_updated_at BEFORE UPDATE ON user_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        CREATE TRIGGER update_user_watchlists_updated_at BEFORE UPDATE ON user_watchlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        -- Trigger para actualizar precios agregados cuando se insertan nuevos precios
        CREATE OR REPLACE FUNCTION trigger_update_aggregated_prices()
        RETURNS TRIGGER AS $$
        BEGIN
            PERFORM update_aggregated_prices();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_aggregated_prices_trigger
        AFTER INSERT OR UPDATE ON price_history
        FOR EACH ROW
        EXECUTE FUNCTION trigger_update_aggregated_prices();
        """
        
        try:
            self.supabase.rpc('exec_sql', {'sql': triggers_sql}).execute()
            print("✅ Triggers creados exitosamente")
        except Exception as e:
            print(f"⚠️ Error creando triggers: {e}")
    
    def run_full_setup(self):
        """Ejecutar configuración completa"""
        print("🚀 Iniciando configuración completa de Supabase...")
        
        try:
            self.create_database_schema()
            self.insert_initial_data()
            self.create_indexes()
            self.create_functions()
            self.setup_rls_policies()
            self.create_triggers()
            
            print("🎉 ¡Configuración de Supabase completada exitosamente!")
            print("\n📋 Resumen de lo que se ha creado:")
            print("   ✅ Esquema de base de datos completo")
            print("   ✅ Datos iniciales (juegos, condiciones, fuentes)")
            print("   ✅ Índices optimizados")
            print("   ✅ Funciones SQL para operaciones comunes")
            print("   ✅ Políticas de seguridad (RLS)")
            print("   ✅ Triggers para mantenimiento automático")
            
        except Exception as e:
            print(f"❌ Error en la configuración: {e}")

def main():
    """Función principal"""
    try:
        setup = SupabaseSetup()
        setup.run_full_setup()
    except Exception as e:
        print(f"❌ Error inicializando Supabase: {e}")
        print("💡 Asegúrate de que las variables de entorno estén configuradas:")
        print("   - SUPABASE_URL")
        print("   - SUPABASE_SERVICE_ROLE_KEY")

if __name__ == "__main__":
    main() 