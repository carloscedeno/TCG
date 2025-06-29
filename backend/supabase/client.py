#!/usr/bin/env python3
"""
APIs de Supabase para el sistema TCG Price Aggregator
Proporciona funciones para interactuar con la base de datos
"""

import os
import json
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv
import asyncio

# Cargar variables de entorno
load_dotenv()

class TCGDatabaseAPI:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
    
    # ============================================================================
    # GESTIÓN DE JUEGOS
    # ============================================================================
    
    def get_games(self, active_only: bool = True) -> List[Dict]:
        """Obtener todos los juegos"""
        query = self.supabase.table('games').select('*')
        if active_only:
            query = query.eq('is_active', True)
        
        response = query.execute()
        return response.data
    
    def get_game_by_code(self, game_code: str) -> Optional[Dict]:
        """Obtener juego por código"""
        response = self.supabase.table('games').select('*').eq('game_code', game_code).execute()
        return response.data[0] if response.data else None
    
    def create_game(self, game_data: Dict) -> Dict:
        """Crear nuevo juego"""
        response = self.supabase.table('games').insert(game_data).execute()
        return response.data[0] if response.data else None
    
    # ============================================================================
    # GESTIÓN DE SETS
    # ============================================================================
    
    def get_sets(self, game_code: str = None, include_digital: bool = False) -> List[Dict]:
        """Obtener sets/ediciones"""
        query = self.supabase.table('sets').select('*, games(game_name, game_code)')
        
        if game_code:
            query = query.eq('games.game_code', game_code)
        
        if not include_digital:
            query = query.eq('is_digital', False)
        
        response = query.execute()
        return response.data
    
    def get_set_by_code(self, game_code: str, set_code: str) -> Optional[Dict]:
        """Obtener set por código"""
        response = self.supabase.table('sets').select('*, games(game_name, game_code)').eq('games.game_code', game_code).eq('set_code', set_code).execute()
        return response.data[0] if response.data else None
    
    def create_set(self, set_data: Dict) -> Dict:
        """Crear nuevo set"""
        response = self.supabase.table('sets').insert(set_data).execute()
        return response.data[0] if response.data else None
    
    # ============================================================================
    # GESTIÓN DE CARTAS
    # ============================================================================
    
    def search_cards(self, query: str, game_code: str = None, limit: int = 50) -> List[Dict]:
        """Buscar cartas por nombre"""
        search_query = self.supabase.table('cards').select('*, games(game_name, game_code)')
        
        if game_code:
            search_query = search_query.eq('games.game_code', game_code)
        
        search_query = search_query.ilike('card_name', f'%{query}%').limit(limit)
        response = search_query.execute()
        return response.data
    
    def get_card_by_id(self, card_id: str) -> Optional[Dict]:
        """Obtener carta por ID"""
        response = self.supabase.table('cards').select('*, games(game_name, game_code)').eq('card_id', card_id).execute()
        return response.data[0] if response.data else None
    
    def get_card_by_name(self, game_code: str, card_name: str) -> Optional[Dict]:
        """Obtener carta por nombre y juego"""
        response = self.supabase.table('cards').select('*, games(game_name, game_code)').eq('games.game_code', game_code).eq('card_name', card_name).execute()
        return response.data[0] if response.data else None
    
    def create_card(self, card_data: Dict) -> Dict:
        """Crear nueva carta"""
        response = self.supabase.table('cards').insert(card_data).execute()
        return response.data[0] if response.data else None
    
    def update_card(self, card_id: str, card_data: Dict) -> Dict:
        """Actualizar carta"""
        response = self.supabase.table('cards').update(card_data).eq('card_id', card_id).execute()
        return response.data[0] if response.data else None
    
    # ============================================================================
    # GESTIÓN DE IMPRESIONES
    # ============================================================================
    
    def get_card_printings(self, card_id: str = None, set_id: int = None) -> List[Dict]:
        """Obtener impresiones de cartas"""
        query = self.supabase.table('card_printings').select('*, cards(card_name, games(game_name, game_code)), sets(set_name, set_code)')
        
        if card_id:
            query = query.eq('card_id', card_id)
        
        if set_id:
            query = query.eq('set_id', set_id)
        
        response = query.execute()
        return response.data
    
    def get_printing_by_id(self, printing_id: str) -> Optional[Dict]:
        """Obtener impresión por ID"""
        response = self.supabase.table('card_printings').select('*, cards(card_name, games(game_name, game_code)), sets(set_name, set_code)').eq('printing_id', printing_id).execute()
        return response.data[0] if response.data else None
    
    def create_printing(self, printing_data: Dict) -> Dict:
        """Crear nueva impresión"""
        response = self.supabase.table('card_printings').insert(printing_data).execute()
        return response.data[0] if response.data else None
    
    # ============================================================================
    # GESTIÓN DE PRECIOS
    # ============================================================================
    
    def insert_price_history(self, price_data: List[Dict]) -> bool:
        """Insertar historial de precios"""
        try:
            response = self.supabase.table('price_history').insert(price_data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error insertando precios: {e}")
            return False
    
    def get_price_history(self, printing_id: str, days: int = 30) -> List[Dict]:
        """Obtener historial de precios"""
        since_date = datetime.now() - timedelta(days=days)
        
        response = self.supabase.table('price_history').select('*, sources(source_name), conditions(condition_name)').eq('printing_id', printing_id).gte('timestamp', since_date.isoformat()).order('timestamp', desc=True).execute()
        return response.data
    
    def get_current_prices(self, printing_id: str) -> List[Dict]:
        """Obtener precios actuales de una impresión"""
        response = self.supabase.table('aggregated_prices').select('*, conditions(condition_name)').eq('printing_id', printing_id).execute()
        return response.data
    
    def get_card_prices(self, card_id: str, condition_id: int = None) -> List[Dict]:
        """Obtener precios de todas las impresiones de una carta"""
        query = self.supabase.table('aggregated_prices').select('*, card_printings(*, sets(set_name), cards(card_name)), conditions(condition_name)').eq('card_printings.cards.card_id', card_id)
        
        if condition_id:
            query = query.eq('condition_id', condition_id)
        
        response = query.execute()
        return response.data
    
    def update_aggregated_prices(self) -> bool:
        """Actualizar precios agregados"""
        try:
            # Llamar a la función SQL
            response = self.supabase.rpc('update_aggregated_prices').execute()
            return True
        except Exception as e:
            print(f"Error actualizando precios agregados: {e}")
            return False
    
    # ============================================================================
    # BÚSQUEDA AVANZADA
    # ============================================================================
    
    def search_cards_with_prices(self, search_query: str = None, game_code: str = None, limit: int = 50) -> List[Dict]:
        """Buscar cartas con precios usando función SQL"""
        try:
            response = self.supabase.rpc('search_cards_with_prices', {
                'search_query': search_query,
                'game_code_filter': game_code,
                'limit_count': limit
            }).execute()
            return response.data
        except Exception as e:
            print(f"Error en búsqueda avanzada: {e}")
            return []
    
    def get_card_prices_detailed(self, card_id: str, condition_id: int = None) -> List[Dict]:
        """Obtener precios detallados de una carta usando función SQL"""
        try:
            response = self.supabase.rpc('get_card_prices', {
                'card_uuid': card_id,
                'condition_filter': condition_id
            }).execute()
            return response.data
        except Exception as e:
            print(f"Error obteniendo precios detallados: {e}")
            return []
    
    # ============================================================================
    # GESTIÓN DE COLECCIONES DE USUARIO
    # ============================================================================
    
    def get_user_collection(self, user_id: str) -> List[Dict]:
        """Obtener colección de usuario"""
        response = self.supabase.table('user_collections').select('*, card_printings(*, sets(set_name), cards(card_name)), conditions(condition_name)').eq('user_id', user_id).execute()
        return response.data
    
    def add_to_collection(self, user_id: str, collection_data: Dict) -> Dict:
        """Añadir carta a la colección"""
        collection_data['user_id'] = user_id
        response = self.supabase.table('user_collections').upsert(collection_data).execute()
        return response.data[0] if response.data else None
    
    def remove_from_collection(self, user_id: str, collection_id: str) -> bool:
        """Eliminar carta de la colección"""
        try:
            response = self.supabase.table('user_collections').delete().eq('collection_id', collection_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error eliminando de colección: {e}")
            return False
    
    def update_collection_item(self, user_id: str, collection_id: str, update_data: Dict) -> Dict:
        """Actualizar item de la colección"""
        response = self.supabase.table('user_collections').update(update_data).eq('collection_id', collection_id).eq('user_id', user_id).execute()
        return response.data[0] if response.data else None
    
    # ============================================================================
    # GESTIÓN DE WATCHLISTS
    # ============================================================================
    
    def get_user_watchlist(self, user_id: str) -> List[Dict]:
        """Obtener watchlist de usuario"""
        response = self.supabase.table('user_watchlists').select('*, card_printings(*, sets(set_name), cards(card_name))').eq('user_id', user_id).eq('is_active', True).execute()
        return response.data
    
    def add_to_watchlist(self, user_id: str, watchlist_data: Dict) -> Dict:
        """Añadir carta al watchlist"""
        watchlist_data['user_id'] = user_id
        response = self.supabase.table('user_watchlists').upsert(watchlist_data).execute()
        return response.data[0] if response.data else None
    
    def remove_from_watchlist(self, user_id: str, watchlist_id: str) -> bool:
        """Eliminar carta del watchlist"""
        try:
            response = self.supabase.table('user_watchlists').delete().eq('watchlist_id', watchlist_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error eliminando de watchlist: {e}")
            return False
    
    def update_watchlist_item(self, user_id: str, watchlist_id: str, update_data: Dict) -> Dict:
        """Actualizar item del watchlist"""
        response = self.supabase.table('user_watchlists').update(update_data).eq('watchlist_id', watchlist_id).eq('user_id', user_id).execute()
        return response.data[0] if response.data else None
    
    # ============================================================================
    # ESTADÍSTICAS Y REPORTES
    # ============================================================================
    
    def get_price_statistics(self, game_code: str = None, days: int = 30) -> Dict:
        """Obtener estadísticas de precios"""
        since_date = datetime.now() - timedelta(days=days)
        
        query = self.supabase.table('price_history').select('price_usd, timestamp, card_printings(*, cards(*, games(game_code)))').gte('timestamp', since_date.isoformat())
        
        if game_code:
            query = query.eq('card_printings.cards.games.game_code', game_code)
        
        response = query.execute()
        
        if not response.data:
            return {}
        
        prices = [item['price_usd'] for item in response.data if item['price_usd']]
        
        return {
            'total_prices': len(prices),
            'avg_price': sum(prices) / len(prices) if prices else 0,
            'min_price': min(prices) if prices else 0,
            'max_price': max(prices) if prices else 0,
            'price_range': max(prices) - min(prices) if prices else 0
        }
    
    def get_collection_value(self, user_id: str) -> Dict:
        """Calcular valor de la colección de usuario"""
        collection = self.get_user_collection(user_id)
        
        total_value_usd = 0
        total_value_eur = 0
        total_cards = 0
        
        for item in collection:
            printing_id = item['printing_id']
            quantity = item['quantity']
            
            # Obtener precio actual
            prices = self.get_current_prices(printing_id)
            if prices:
                # Usar precio promedio
                avg_price = prices[0].get('avg_market_price_usd', 0)
                total_value_usd += avg_price * quantity
                total_cards += quantity
        
        return {
            'total_cards': total_cards,
            'total_value_usd': total_value_usd,
            'total_value_eur': total_value_eur,
            'collection_items': len(collection)
        }
    
    # ============================================================================
    # IMPORTACIÓN MASIVA DE DATOS
    # ============================================================================
    
    def bulk_insert_cards(self, cards_data: List[Dict]) -> bool:
        """Insertar múltiples cartas"""
        try:
            response = self.supabase.table('cards').insert(cards_data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error en inserción masiva de cartas: {e}")
            return False
    
    def bulk_insert_printings(self, printings_data: List[Dict]) -> bool:
        """Insertar múltiples impresiones"""
        try:
            response = self.supabase.table('card_printings').insert(printings_data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error en inserción masiva de impresiones: {e}")
            return False
    
    def bulk_insert_prices(self, prices_data: List[Dict]) -> bool:
        """Insertar múltiples precios"""
        try:
            response = self.supabase.table('price_history').insert(prices_data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error en inserción masiva de precios: {e}")
            return False
    
    # ============================================================================
    # UTILIDADES
    # ============================================================================
    
    def get_conditions(self) -> List[Dict]:
        """Obtener todas las condiciones"""
        response = self.supabase.table('conditions').select('*').order('sort_order').execute()
        return response.data
    
    def get_sources(self, active_only: bool = True) -> List[Dict]:
        """Obtener todas las fuentes"""
        query = self.supabase.table('sources').select('*')
        if active_only:
            query = query.eq('is_active', True)
        
        response = query.execute()
        return response.data
    
    def test_connection(self) -> bool:
        """Probar conexión con la base de datos"""
        try:
            response = self.supabase.table('games').select('count').limit(1).execute()
            return True
        except Exception as e:
            print(f"Error de conexión: {e}")
            return False

# ============================================================================
# FUNCIONES DE CONVENIENCIA PARA OPERACIONES COMUNES
# ============================================================================

class TCGAPIHelper:
    def __init__(self):
        self.api = TCGDatabaseAPI()
    
    def get_card_with_prices(self, game_code: str, card_name: str) -> Optional[Dict]:
        """Obtener carta con sus precios actuales"""
        card = self.api.get_card_by_name(game_code, card_name)
        if not card:
            return None
        
        printings = self.api.get_card_printings(card['card_id'])
        for printing in printings:
            prices = self.api.get_current_prices(printing['printing_id'])
            printing['current_prices'] = prices
        
        card['printings'] = printings
        return card
    
    def search_cards_simple(self, query: str, game_code: str = None) -> List[Dict]:
        """Búsqueda simple de cartas con precios"""
        return self.api.search_cards_with_prices(query, game_code, 20)
    
    def get_game_overview(self, game_code: str) -> Dict:
        """Obtener resumen de un juego"""
        game = self.api.get_game_by_code(game_code)
        if not game:
            return {}
        
        sets = self.api.get_sets(game_code)
        stats = self.api.get_price_statistics(game_code, 30)
        
        return {
            'game': game,
            'sets_count': len(sets),
            'price_statistics': stats,
            'recent_sets': sets[:5]  # Últimos 5 sets
        }

# Ejemplo de uso
if __name__ == "__main__":
    try:
        api = TCGDatabaseAPI()
        
        # Probar conexión
        if api.test_connection():
            print("✅ Conexión exitosa con Supabase")
            
            # Obtener juegos
            games = api.get_games()
            print(f"📋 Juegos disponibles: {len(games)}")
            
            # Obtener condiciones
            conditions = api.get_conditions()
            print(f"📋 Condiciones disponibles: {len(conditions)}")
            
            # Obtener fuentes
            sources = api.get_sources()
            print(f"📋 Fuentes disponibles: {len(sources)}")
            
        else:
            print("❌ Error de conexión con Supabase")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Asegúrate de configurar las variables de entorno:")
        print("   - SUPABASE_URL")
        print("   - SUPABASE_ANON_KEY") 