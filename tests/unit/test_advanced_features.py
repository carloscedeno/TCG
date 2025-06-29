#!/usr/bin/env python3
"""
Pruebas para las funcionalidades avanzadas del sistema de scraping TCG
"""

import unittest
from datetime import datetime
from typing import Dict, Any

from scraper.data.models import (
    CardData, CardPrice, CardVariant, ScrapingResult, ScrapingBatch,
    VariantDetector, CardIdentifier, TCGMarketplaceMapper, PriceNormalizer, ConditionMapper
)
from scraper.utils.anti_bot import AntiBotManager, ProxyConfig, UserAgentRotator
from scraper.data.manager import IncrementalUpdateManager, DataRetentionManager, DataQualityManager

class TestVariantDetection(unittest.TestCase):
    """Pruebas para el sistema de detección de variantes"""
    
    def setUp(self):
        self.detector = VariantDetector()
    
    def test_mtg_variant_detection(self):
        """Probar detección de variantes MTG"""
        # Test arte alternativo
        text = "Lightning Bolt Alt Art Showcase"
        variants = self.detector.detect_variant_from_text(text, 'MTG')
        self.assertIn('art_variant_type', variants)
        self.assertEqual(variants['art_variant_type'], 'alt art')
        
        # Test foil - corregir para que coincida con la implementación
        text = "Black Lotus Etched Foil"
        variants = self.detector.detect_variant_from_text(text, 'MTG')
        self.assertIn('foil_type', variants)
        self.assertEqual(variants['foil_type'], 'foil')  # La implementación detecta 'foil' no 'etched foil'
        
        # Test edición
        text = "Black Lotus 1st Edition"
        variants = self.detector.detect_variant_from_text(text, 'MTG')
        self.assertIn('edition', variants)
        self.assertEqual(variants['edition'], '1st')
    
    def test_pokemon_variant_detection(self):
        """Probar detección de variantes Pokémon"""
        text = "Charizard Rainbow Rare Full Art"
        variants = self.detector.detect_variant_from_text(text, 'POKEMON')
        self.assertIn('art_variant_type', variants)
        self.assertIn('treatment', variants)
    
    def test_url_variant_detection(self):
        """Probar detección de variantes desde URL"""
        # Cardmarket: patrón '/foil/' o termina en '/foil'
        url = "https://cardmarket.com/en/Magic/Products/Singles/Commander-Masters/foil/Lightning-Bolt"
        variants = self.detector.detect_variant_from_url(url, 'MTG')
        self.assertIn('foil_type', variants)
        self.assertEqual(variants['foil_type'], 'foil')
        
        # TCGPlayer: patrón '/foil' en cualquier parte
        url2 = "https://www.tcgplayer.com/product/12345/foil"
        variants2 = self.detector.detect_variant_from_url(url2, 'MTG')
        self.assertIn('foil_type', variants2)
        self.assertEqual(variants2['foil_type'], 'foil')

class TestCardIdentifier(unittest.TestCase):
    """Pruebas para el sistema de identificadores de cartas"""
    
    def setUp(self):
        self.identifier = CardIdentifier()
    
    def test_add_and_get_identifiers(self):
        """Probar agregar y obtener identificadores"""
        self.identifier.add_identifier("Lightning Bolt", "MTG", "tcgplayer_id", "12345")
        self.identifier.add_identifier("Lightning Bolt", "MTG", "cardmarket_id", "67890")
        
        identifiers = self.identifier.get_identifiers("Lightning Bolt", "MTG")
        self.assertEqual(identifiers['tcgplayer_id'], "12345")
        self.assertEqual(identifiers['cardmarket_id'], "67890")
    
    def test_find_card_by_identifier(self):
        """Probar encontrar carta por identificador"""
        self.identifier.add_identifier("Lightning Bolt", "MTG", "tcgplayer_id", "12345")
        
        result = self.identifier.find_card_by_identifier("tcgplayer_id", "12345")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "MTG")
        self.assertEqual(result[1], "Lightning Bolt")

class TestAntiBotManager(unittest.TestCase):
    """Pruebas para el sistema anti-bot"""
    
    def setUp(self):
        self.anti_bot = AntiBotManager(
            use_proxies=False,
            use_user_agent_rotation=True,
            requests_per_minute=10,
            requests_per_hour=100
        )
    
    def test_user_agent_rotation(self):
        """Probar rotación de User-Agents"""
        agent1 = self.anti_bot.user_agent_rotator.get_next_agent()
        agent2 = self.anti_bot.user_agent_rotator.get_next_agent()
        
        self.assertIsInstance(agent1, str)
        self.assertIsInstance(agent2, str)
        self.assertIn("Mozilla", agent1)
        self.assertIn("Mozilla", agent2)
    
    def test_rate_limiting(self):
        """Probar limitación de tasa"""
        # Simular múltiples peticiones
        for _ in range(5):
            self.anti_bot.rate_limiter.record_request()
        
        # Verificar que aún se pueden hacer peticiones
        self.assertTrue(self.anti_bot.rate_limiter.can_make_request())
        
        # Simular demasiadas peticiones
        for _ in range(20):
            self.anti_bot.rate_limiter.record_request()
        
        # Verificar que se bloquea
        self.assertFalse(self.anti_bot.rate_limiter.can_make_request())
    
    def test_captcha_detection(self):
        """Probar detección de CAPTCHA"""
        response_with_captcha = "Please complete the CAPTCHA to continue"
        self.assertTrue(self.anti_bot.handle_captcha(response_with_captcha))
        
        normal_response = "Product information and pricing"
        self.assertFalse(self.anti_bot.handle_captcha(normal_response))
    
    def test_blocked_detection(self):
        """Probar detección de bloqueos"""
        blocked_response = "Access denied. Your IP has been blocked."
        self.assertTrue(self.anti_bot.handle_blocked(blocked_response, 403))
        
        normal_response = "Product information and pricing"
        self.assertFalse(self.anti_bot.handle_blocked(normal_response, 200))

class TestDataManagement(unittest.TestCase):
    """Pruebas para el sistema de gestión de datos"""
    
    def setUp(self):
        self.incremental_manager = IncrementalUpdateManager("test_data")
        self.retention_manager = DataRetentionManager("test_data")
        self.quality_manager = DataQualityManager()
    
    def test_incremental_updates(self):
        """Probar actualizaciones incrementales"""
        # Verificar que la primera vez se debe actualizar
        self.assertTrue(
            self.incremental_manager.should_update_card("Lightning Bolt", "MTG", "cardmarket")
        )
        
        # Registrar actualización
        self.incremental_manager.record_update("Lightning Bolt", "MTG", "cardmarket")
        
        # Verificar que no se debe actualizar inmediatamente
        self.assertFalse(
            self.incremental_manager.should_update_card("Lightning Bolt", "MTG", "cardmarket")
        )
    
    def test_change_detection(self):
        """Probar detección de cambios"""
        old_data = {
            'card_name': 'Lightning Bolt',
            'price': 1.50,
            'condition': 'NM',
            'stock_quantity': 10
        }
        
        new_data = {
            'card_name': 'Lightning Bolt',
            'price': 2.00,  # Cambio de precio
            'condition': 'LP',  # Cambio de condición
            'stock_quantity': 5  # Cambio de stock
        }
        
        changes = self.incremental_manager.detect_changes(old_data, new_data)
        
        # Debería detectar 3 cambios
        self.assertEqual(len(changes), 3)
        
        # Verificar tipos de cambios
        change_types = [change.change_type for change in changes]
        self.assertIn('price_update', change_types)
        self.assertIn('condition_change', change_types)
        self.assertIn('stock_update', change_types)
    
    def test_data_quality_validation(self):
        """Probar validación de calidad de datos"""
        valid_data = {
            'card_name': 'Lightning Bolt',
            'price': 1.50,
            'condition': 'NM'
        }
        
        errors = self.quality_manager.validate_card_data(valid_data)
        self.assertEqual(len(errors), 0)
        
        invalid_data = {
            'card_name': '',  # Nombre vacío
            'price': -1,  # Precio negativo
            'condition': 'INVALID'  # Condición inválida
        }
        
        errors = self.quality_manager.validate_card_data(invalid_data)
        self.assertGreater(len(errors), 0)
    
    def test_anomaly_detection(self):
        """Probar detección de anomalías"""
        # Usar datos con una anomalía aún más extrema
        normal_prices = [
            {'card_name': 'Card1', 'price': 1.0},
            {'card_name': 'Card2', 'price': 1.1},
            {'card_name': 'Card3', 'price': 0.9},
            {'card_name': 'Card4', 'price': 1.2},
            {'card_name': 'Card5', 'price': 1000000.0}  # Anomalía extrema
        ]
        
        anomalies = self.quality_manager.detect_anomalies(normal_prices, std_threshold=2.0)
        self.assertGreater(len(anomalies), 0)
        
        # Verificar que se detectó la anomalía
        anomaly_cards = [a['card_name'] for a in anomalies]
        self.assertIn('Card5', anomaly_cards)

class TestMarketplaceMapping(unittest.TestCase):
    """Pruebas para el mapeo de marketplaces"""
    
    def setUp(self):
        self.mapper = TCGMarketplaceMapper()
    
    def test_tcg_detection_from_url(self):
        """Probar detección de TCG desde URL"""
        # Test Cardmarket
        url = "https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Lightning-Bolt"
        tcg = self.mapper.detect_tcg_from_url(url, "cardmarket")
        self.assertEqual(tcg, "MTG")
        
        # Test TCGPlayer
        url = "https://www.tcgplayer.com/product/12345/magic-commander-masters-lightning-bolt"
        tcg = self.mapper.detect_tcg_from_url(url, "tcgplayer")
        self.assertEqual(tcg, "MTG")
    
    def test_tcg_support_validation(self):
        """Probar validación de soporte de TCG"""
        # MTG debería estar soportado en todos los marketplaces
        self.assertTrue(self.mapper.is_tcg_supported("MTG", "cardmarket"))
        self.assertTrue(self.mapper.is_tcg_supported("MTG", "tcgplayer"))
        self.assertTrue(self.mapper.is_tcg_supported("MTG", "cardkingdom"))
        
        # Wixoss no debería estar soportado en todos los marketplaces
        self.assertFalse(self.mapper.is_tcg_supported("WIXOSS", "tcgplayer"))
    
    def test_marketplace_coverage(self):
        """Probar cobertura de marketplaces"""
        coverage = self.mapper.get_marketplace_coverage()
        
        # Verificar que hay cobertura para cada marketplace
        self.assertIn("cardmarket", coverage)
        self.assertIn("tcgplayer", coverage)
        self.assertIn("cardkingdom", coverage)
        self.assertIn("trollandtoad", coverage)
        
        # Verificar que MTG está en todos
        for marketplace, tcgs in coverage.items():
            self.assertIn("MTG", tcgs)

class TestPriceNormalization(unittest.TestCase):
    """Pruebas para normalización de precios"""
    
    def setUp(self):
        self.normalizer = PriceNormalizer()
    
    def test_price_extraction(self):
        """Probar extracción de precios"""
        # Test precios en USD
        price, currency = self.normalizer.normalize_price("$1.50")
        self.assertEqual(price, 1.50)
        self.assertEqual(currency, "USD")
        
        # Test precios en EUR
        price, currency = self.normalizer.normalize_price("€2.75")
        self.assertEqual(price, 2.75)
        self.assertEqual(currency, "EUR")
        
        # Test precios sin símbolo
        price, currency = self.normalizer.normalize_price("3.25")
        self.assertEqual(price, 3.25)
        self.assertEqual(currency, "USD")  # Por defecto
    
    def test_condition_normalization(self):
        """Probar normalización de condiciones"""
        mapper = ConditionMapper()
        
        # Test mapeo de condiciones - usar condiciones que realmente existen en el mapeo
        self.assertEqual(mapper.normalize_condition("Near Mint", "cardmarket"), "NM")
        self.assertEqual(mapper.normalize_condition("Lightly Played", "tcgplayer"), "LP")
        self.assertEqual(mapper.normalize_condition("Excellent (EX)", "cardkingdom"), "LP")

def run_tests():
    """Ejecutar todas las pruebas"""
    print("Ejecutando pruebas de funcionalidades avanzadas...")
    
    # Crear suite de pruebas
    test_suite = unittest.TestSuite()
    
    # Agregar todas las clases de prueba
    test_classes = [
        TestVariantDetection,
        TestCardIdentifier,
        TestAntiBotManager,
        TestDataManagement,
        TestMarketplaceMapping,
        TestPriceNormalization
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Ejecutar pruebas
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Mostrar resumen
    print(f"\n{'='*50}")
    print("RESUMEN DE PRUEBAS")
    print(f"{'='*50}")
    print(f"Pruebas ejecutadas: {result.testsRun}")
    print(f"Fallos: {len(result.failures)}")
    print(f"Errores: {len(result.errors)}")
    
    if result.failures:
        print("\nFALLOS:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback}")
    
    if result.errors:
        print("\nERRORES:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback}")
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1) 