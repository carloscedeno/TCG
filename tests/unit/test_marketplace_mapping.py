#!/usr/bin/env python3
"""
Script de prueba para verificar el mapeo de TCG por marketplace
"""

import sys
from scraper.data.models import TCGMarketplaceMapper

def test_tcg_detection():
    """Probar la detección de TCG desde URLs"""
    
    # URLs de prueba para cada marketplace y TCG
    test_cases = [
        # Cardmarket
        {
            'url': 'https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Sol-Ring',
            'source': 'cardmarket',
            'expected': 'MTG'
        },
        {
            'url': 'https://www.cardmarket.com/en/Pokemon/Products/Singles/Base-Set/Charizard',
            'source': 'cardmarket',
            'expected': 'POKEMON'
        },
        {
            'url': 'https://www.cardmarket.com/en/Lorcana/Products/Singles/The-First-Chapter/Elsa-Spirit-of-Winter',
            'source': 'cardmarket',
            'expected': 'LORCANA'
        },
        {
            'url': 'https://www.cardmarket.com/en/Flesh-and-Blood/Products/Singles/Monarch/Prism',
            'source': 'cardmarket',
            'expected': 'FAB'
        },
        {
            'url': 'https://www.cardmarket.com/en/YuGiOh/Products/Singles/Legend-of-Blue-Eyes-White-Dragon/Blue-Eyes-White-Dragon',
            'source': 'cardmarket',
            'expected': 'YUGIOH'
        },
        {
            'url': 'https://www.cardmarket.com/en/Wixoss/Products/Singles/Peeping-Analyze/Tama',
            'source': 'cardmarket',
            'expected': 'WIXOSS'
        },
        {
            'url': 'https://www.cardmarket.com/en/One-Piece/Products/Singles/OP-01-Romance-Dawn/Luffy',
            'source': 'cardmarket',
            'expected': 'ONEPIECE'
        },
        
        # TCGplayer
        {
            'url': 'https://www.tcgplayer.com/product/12345/sol-ring-magic-the-gathering',
            'source': 'tcgplayer',
            'expected': 'MTG'
        },
        {
            'url': 'https://www.tcgplayer.com/product/67890/charizard-pokemon',
            'source': 'tcgplayer',
            'expected': 'POKEMON'
        },
        {
            'url': 'https://www.tcgplayer.com/product/11111/elsa-spirit-of-winter-lorcana',
            'source': 'tcgplayer',
            'expected': 'LORCANA'
        },
        {
            'url': 'https://www.tcgplayer.com/product/22222/prism-flesh-and-blood',
            'source': 'tcgplayer',
            'expected': 'FAB'
        },
        {
            'url': 'https://www.tcgplayer.com/product/33333/blue-eyes-white-dragon-yugioh',
            'source': 'tcgplayer',
            'expected': 'YUGIOH'
        },
        {
            'url': 'https://www.tcgplayer.com/product/44444/luffy-one-piece',
            'source': 'tcgplayer',
            'expected': 'ONEPIECE'
        },
        
        # Card Kingdom
        {
            'url': 'https://www.cardkingdom.com/catalog/magic_the_gathering/search?search=general&filter[name]=sol+ring',
            'source': 'cardkingdom',
            'expected': 'MTG'
        },
        {
            'url': 'https://www.cardkingdom.com/catalog/pokemon/search?search=general&filter[name]=charizard',
            'source': 'cardkingdom',
            'expected': 'POKEMON'
        },
        {
            'url': 'https://www.cardkingdom.com/catalog/lorcana/search?search=general&filter[name]=elsa',
            'source': 'cardkingdom',
            'expected': 'LORCANA'
        },
        {
            'url': 'https://www.cardkingdom.com/catalog/flesh_and_blood/search?search=general&filter[name]=prism',
            'source': 'cardkingdom',
            'expected': 'FAB'
        },
        {
            'url': 'https://www.cardkingdom.com/catalog/yugioh/search?search=general&filter[name]=blue+eyes',
            'source': 'cardkingdom',
            'expected': 'YUGIOH'
        },
        {
            'url': 'https://www.cardkingdom.com/catalog/one_piece/search?search=general&filter[name]=luffy',
            'source': 'cardkingdom',
            'expected': 'ONEPIECE'
        },
        
        # Troll and Toad
        {
            'url': 'https://www.trollandtoad.com/magic-the-gathering/singles/commander-masters/sol-ring',
            'source': 'trollandtoad',
            'expected': 'MTG'
        },
        {
            'url': 'https://www.trollandtoad.com/pokemon/singles/base-set/charizard',
            'source': 'trollandtoad',
            'expected': 'POKEMON'
        },
        {
            'url': 'https://www.trollandtoad.com/lorcana/singles/the-first-chapter/elsa',
            'source': 'trollandtoad',
            'expected': 'LORCANA'
        },
        {
            'url': 'https://www.trollandtoad.com/flesh-and-blood/singles/monarch/prism',
            'source': 'trollandtoad',
            'expected': 'FAB'
        },
        {
            'url': 'https://www.trollandtoad.com/yugioh/singles/legend-of-blue-eyes/blue-eyes-white-dragon',
            'source': 'trollandtoad',
            'expected': 'YUGIOH'
        },
        {
            'url': 'https://www.trollandtoad.com/one-piece/singles/op-01-romance-dawn/luffy',
            'source': 'trollandtoad',
            'expected': 'ONEPIECE'
        }
    ]
    
    print("=== PRUEBA DE DETECCIÓN DE TCG ===")
    print()
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        url = test_case['url']
        source = test_case['source']
        expected = test_case['expected']
        
        detected = TCGMarketplaceMapper.detect_tcg_from_url(url, source)
        
        if detected == expected:
            print(f"✓ Test {i}: {source} -> {detected} (esperado: {expected})")
            passed += 1
        else:
            print(f"✗ Test {i}: {source} -> {detected} (esperado: {expected})")
            failed += 1
    
    print()
    print(f"Resultados: {passed} pasaron, {failed} fallaron")
    print()
    
    return failed == 0

def test_tcg_support():
    """Probar la validación de soporte de TCG"""
    
    print("=== PRUEBA DE SOPORTE DE TCG ===")
    print()
    
    # Casos de prueba para validación de soporte
    test_cases = [
        # Casos válidos
        ('MTG', 'cardmarket', True),
        ('POKEMON', 'tcgplayer', True),
        ('LORCANA', 'cardkingdom', True),
        ('FAB', 'trollandtoad', True),
        ('YUGIOH', 'cardmarket', True),
        ('ONEPIECE', 'tcgplayer', True),
        
        # Casos inválidos (Wixoss no está en todos los marketplaces)
        ('WIXOSS', 'tcgplayer', False),
        ('WIXOSS', 'cardkingdom', False),
        ('WIXOSS', 'trollandtoad', False),
        
        # Casos válidos (Wixoss solo en Cardmarket)
        ('WIXOSS', 'cardmarket', True),
        
        # Casos inválidos (marketplace inexistente)
        ('MTG', 'marketplace_inexistente', False),
        ('POKEMON', 'otro_marketplace', False),
    ]
    
    passed = 0
    failed = 0
    
    for tcg, source, expected in test_cases:
        is_supported = TCGMarketplaceMapper.is_tcg_supported(tcg, source)
        
        if is_supported == expected:
            print(f"✓ {tcg} en {source}: {'Soportado' if is_supported else 'No soportado'} (esperado: {'Soportado' if expected else 'No soportado'})")
            passed += 1
        else:
            print(f"✗ {tcg} en {source}: {'Soportado' if is_supported else 'No soportado'} (esperado: {'Soportado' if expected else 'No soportado'})")
            failed += 1
    
    print()
    print(f"Resultados: {passed} pasaron, {failed} fallaron")
    print()
    
    return failed == 0

def test_marketplace_coverage():
    """Probar la obtención de cobertura de marketplaces"""
    
    print("=== PRUEBA DE COBERTURA DE MARKETPLACES ===")
    print()
    
    coverage = TCGMarketplaceMapper.get_marketplace_coverage()
    
    print("Cobertura por marketplace:")
    for source, tcgs in coverage.items():
        print(f"  {source}: {', '.join(tcgs)}")
    
    print()
    
    # Probar obtención de mejores marketplaces por TCG
    print("Mejores marketplaces por TCG:")
    all_tcgs = set()
    for tcgs in coverage.values():
        all_tcgs.update(tcgs)
    
    for tcg in sorted(all_tcgs):
        best_marketplaces = TCGMarketplaceMapper.get_best_marketplace_for_tcg(tcg)
        print(f"  {tcg}: {', '.join(best_marketplaces)}")
    
    print()
    
    # Verificar que Wixoss solo está en Cardmarket
    wixoss_marketplaces = TCGMarketplaceMapper.get_best_marketplace_for_tcg('WIXOSS')
    if wixoss_marketplaces == ['cardmarket']:
        print("✓ Wixoss correctamente limitado a Cardmarket")
        return True
    else:
        print(f"✗ Wixoss debería estar solo en Cardmarket, pero está en: {wixoss_marketplaces}")
        return False

def main():
    """Función principal de pruebas"""
    print("🧪 PRUEBAS DEL MAPEADOR DE TCG POR MARKETPLACE")
    print("=" * 50)
    print()
    
    # Ejecutar todas las pruebas
    test1_passed = test_tcg_detection()
    test2_passed = test_tcg_support()
    test3_passed = test_marketplace_coverage()
    
    print("=" * 50)
    print("RESUMEN DE PRUEBAS:")
    print(f"  Detección de TCG: {'✓ PASÓ' if test1_passed else '✗ FALLÓ'}")
    print(f"  Soporte de TCG: {'✓ PASÓ' if test2_passed else '✗ FALLÓ'}")
    print(f"  Cobertura de marketplaces: {'✓ PASÓ' if test3_passed else '✗ FALLÓ'}")
    print()
    
    all_passed = test1_passed and test2_passed and test3_passed
    
    if all_passed:
        print("🎉 TODAS LAS PRUEBAS PASARON")
        print("El mapeador de TCG por marketplace funciona correctamente.")
    else:
        print("❌ ALGUNAS PRUEBAS FALLARON")
        print("Revisar la implementación del mapeador.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main()) 