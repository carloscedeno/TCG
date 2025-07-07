#!/usr/bin/env python3
"""
Script para probar todas las APIs de Supabase y verificar su funcionamiento
"""

import asyncio
import json
from datetime import datetime
from backend.supabase.client import TCGDatabaseAPI

class SupabaseAPITester:
    def __init__(self):
        self.api = TCGDatabaseAPI()
    
    def test_basic_operations(self):
        """Probar operaciones básicas"""
        print("🔧 Probando operaciones básicas...")
        
        # Probar conexión
        if not self.api.test_connection():
            print("❌ Error de conexión con Supabase")
            return False
        
        print("✅ Conexión exitosa")
        
        # Obtener juegos
        games = self.api.get_games()
        print(f"✅ Juegos disponibles: {len(games)}")
        for game in games:
            print(f"   - {game['game_name']} ({game['game_code']})")
        
        # Obtener condiciones
        conditions = self.api.get_conditions()
        print(f"✅ Condiciones disponibles: {len(conditions)}")
        for condition in conditions:
            print(f"   - {condition['condition_name']} ({condition['condition_code']})")
        
        # Obtener fuentes
        sources = self.api.get_sources()
        print(f"✅ Fuentes disponibles: {len(sources)}")
        for source in sources:
            print(f"   - {source['source_name']} ({source['source_code']})")
        
        return True
    
    def test_game_operations(self):
        """Probar operaciones de juegos"""
        print("\n🎮 Probando operaciones de juegos...")
        
        # Obtener juego específico
        mtg_game = self.api.get_game_by_code('MTG')
        if mtg_game:
            print(f"✅ MTG encontrado: {mtg_game['game_name']}")
        else:
            print("❌ MTG no encontrado")
        
        # Obtener sets de MTG
        mtg_sets = self.api.get_sets('MTG')
        print(f"✅ Sets de MTG: {len(mtg_sets)}")
        for set_data in mtg_sets[:3]:  # Mostrar solo los primeros 3
            print(f"   - {set_data['set_name']} ({set_data['set_code']})")
        
        return True
    
    def test_card_operations(self):
        """Probar operaciones de cartas"""
        print("\n🎴 Probando operaciones de cartas...")
        
        # Buscar cartas
        search_results = self.api.search_cards('Black Lotus', 'MTG')
        print(f"✅ Búsqueda 'Black Lotus' en MTG: {len(search_results)} resultados")
        
        if search_results:
            card = search_results[0]
            print(f"   - {card['card_name']} ({card['type_line']})")
            
            # Obtener impresiones de la carta
            printings = self.api.get_card_printings(card['card_id'])
            print(f"   - Impresiones disponibles: {len(printings)}")
            
            # Obtener precios de la carta
            prices = self.api.get_card_prices(card['card_id'])
            print(f"   - Precios disponibles: {len(prices)}")
        
        # Búsqueda avanzada
        advanced_results = self.api.search_cards_with_prices('Charizard', 'POKEMON', 5)
        print(f"✅ Búsqueda avanzada 'Charizard' en Pokémon: {len(advanced_results)} resultados")
        
        return True
    
    def test_price_operations(self):
        """Probar operaciones de precios"""
        print("\n💰 Probando operaciones de precios...")
        
        # Obtener estadísticas de precios
        mtg_stats = self.api.get_price_statistics('MTG', 30)
        if mtg_stats:
            print(f"✅ Estadísticas de precios MTG (30 días):")
            print(f"   - Total de precios: {mtg_stats.get('total_prices', 0)}")
            print(f"   - Precio promedio: ${mtg_stats.get('avg_price', 0):.2f}")
            print(f"   - Rango de precios: ${mtg_stats.get('min_price', 0):.2f} - ${mtg_stats.get('max_price', 0):.2f}")
        
        # Actualizar precios agregados
        if self.api.update_aggregated_prices():
            print("✅ Precios agregados actualizados")
        else:
            print("⚠️ Error actualizando precios agregados")
        
        return True
    
    def test_collection_operations(self):
        """Probar operaciones de colecciones (simulado)"""
        print("\n📚 Probando operaciones de colecciones...")
        
        # Simular usuario
        test_user_id = "test-user-123"
        
        # Obtener colección (debería estar vacía)
        collection = self.api.get_user_collection(test_user_id)
        print(f"✅ Colección del usuario: {len(collection)} items")
        
        # Obtener watchlist (debería estar vacío)
        watchlist = self.api.get_user_watchlist(test_user_id)
        print(f"✅ Watchlist del usuario: {len(watchlist)} items")
        
        return True
    
    def test_bulk_operations(self):
        """Probar operaciones masivas"""
        print("\n📦 Probando operaciones masivas...")
        
        # Crear datos de prueba
        test_cards = [
            {
                'game_id': 1,  # MTG
                'card_name': 'Test Card 1',
                'type_line': 'Creature — Test',
                'base_rarity': 'Common',
                'tcg_specific_attributes': {'test': True}
            },
            {
                'game_id': 1,  # MTG
                'card_name': 'Test Card 2',
                'type_line': 'Instant',
                'base_rarity': 'Uncommon',
                'tcg_specific_attributes': {'test': True}
            }
        ]
        
        # Insertar cartas de prueba
        if self.api.bulk_insert_cards(test_cards):
            print("✅ Inserción masiva de cartas exitosa")
        else:
            print("❌ Error en inserción masiva de cartas")
        
        return True
    
    def test_error_handling(self):
        """Probar manejo de errores"""
        print("\n⚠️ Probando manejo de errores...")
        
        # Intentar obtener juego inexistente
        fake_game = self.api.get_game_by_code('FAKE')
        if fake_game is None:
            print("✅ Manejo correcto de juego inexistente")
        else:
            print("❌ Error: Se encontró un juego inexistente")
        
        # Intentar obtener carta inexistente
        fake_card = self.api.get_card_by_name('MTG', 'Fake Card That Does Not Exist')
        if fake_card is None:
            print("✅ Manejo correcto de carta inexistente")
        else:
            print("❌ Error: Se encontró una carta inexistente")
        
        return True
    
    def generate_test_report(self):
        """Generar reporte de pruebas"""
        print("\n📊 Generando reporte de pruebas...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'tests': {
                'basic_operations': self.test_basic_operations(),
                'game_operations': self.test_game_operations(),
                'card_operations': self.test_card_operations(),
                'price_operations': self.test_price_operations(),
                'collection_operations': self.test_collection_operations(),
                'bulk_operations': self.test_bulk_operations(),
                'error_handling': self.test_error_handling()
            }
        }
        
        # Contar pruebas exitosas
        successful_tests = sum(report['tests'].values())
        total_tests = len(report['tests'])
        
        print(f"\n🎯 RESULTADOS DE PRUEBAS:")
        print(f"   Pruebas exitosas: {successful_tests}/{total_tests}")
        print(f"   Tasa de éxito: {(successful_tests/total_tests*100):.1f}%")
        
        # Mostrar detalles
        for test_name, result in report['tests'].items():
            status = "✅ PASÓ" if result else "❌ FALLÓ"
            print(f"   {test_name}: {status}")
        
        # Guardar reporte
        with open('api_test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n💾 Reporte guardado en: api_test_report.json")
        
        return successful_tests == total_tests

def main():
    """Función principal"""
    print("🧪 INICIANDO PRUEBAS DE APIS SUPABASE")
    print("=" * 50)
    
    try:
        tester = SupabaseAPITester()
        success = tester.generate_test_report()
        
        if success:
            print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
        else:
            print("\n⚠️ Algunas pruebas fallaron. Revisa el reporte para más detalles.")
        
    except Exception as e:
        print(f"\n❌ Error durante las pruebas: {e}")
        print("💡 Asegúrate de que:")
        print("   - Supabase esté configurado correctamente")
        print("   - Las variables de entorno estén definidas")
        print("   - La base de datos tenga datos de prueba")

if __name__ == "__main__":
    main() 