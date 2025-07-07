#!/usr/bin/env python3
"""
Script para verificar la cobertura real de TCGs en cada marketplace
"""

from scraper.data.models import TCGMarketplaceMapper

def main():
    """Mostrar cobertura de TCGs por marketplace"""
    mapper = TCGMarketplaceMapper()
    
    print("=" * 60)
    print("COBERTURA DE TCGs POR MARKETPLACE")
    print("=" * 60)
    
    # Obtener cobertura
    coverage = mapper.get_marketplace_coverage()
    
    # Mostrar por marketplace
    for source, tcgs in coverage.items():
        print(f"\n{source.upper()}:")
        for tcg in sorted(tcgs):
            print(f"  ✓ {tcg}")
    
    print("\n" + "=" * 60)
    print("RESUMEN POR TCG")
    print("=" * 60)
    
    # Mostrar resumen por TCG
    for tcg, info in mapper.get_marketplace_coverage().items():
        best_marketplaces = mapper.get_best_marketplace_for_tcg(tcg)
        print(f"\n{tcg}:")
        print(f"  Disponible en: {', '.join(best_marketplaces)}")
        print(f"  Marketplaces: {len(best_marketplaces)}")
    
    print("\n" + "=" * 60)
    print("RECOMENDACIONES PARA SCRAPING")
    print("=" * 60)
    
    # Recomendaciones específicas
    recommendations = {
        'MTG': {
            'primary': 'cardmarket',
            'secondary': 'tcgplayer',
            'sets': ['Commander Masters', 'Modern Horizons 3', 'Outlaws of Thunder Junction'],
            'cards_per_set': 33
        },
        'POKEMON': {
            'primary': 'cardmarket',
            'secondary': 'tcgplayer',
            'sets': ['Base Set', 'Jungle', 'Fossil', 'Base Set 2'],
            'cards_per_set': 25
        },
        'YUGIOH': {
            'primary': 'cardmarket',
            'secondary': 'tcgplayer',
            'sets': ['Legend of Blue Eyes White Dragon', 'Metal Raiders', 'Magic Ruler'],
            'cards_per_set': 33
        },
        'LORCANA': {
            'primary': 'cardmarket',
            'secondary': 'tcgplayer',
            'sets': ['The First Chapter', 'Rise of the Floodborn'],
            'cards_per_set': 50
        },
        'FAB': {
            'primary': 'cardmarket',
            'secondary': 'cardkingdom',
            'sets': ['Welcome to Rathe', 'Arcane Rising', 'Monarch'],
            'cards_per_set': 33
        },
        'ONEPIECE': {
            'primary': 'cardmarket',
            'secondary': 'tcgplayer',
            'sets': ['Romance Dawn', 'Paramount War', 'Pillars of Strength'],
            'cards_per_set': 33
        },
        'WIXOSS': {
            'primary': 'cardmarket',
            'secondary': None,
            'sets': ['Diva', 'Diva Duel', 'Diva Duel 2'],
            'cards_per_set': 33
        }
    }
    
    for tcg, rec in recommendations.items():
        if tcg in coverage.get('cardmarket', []):
            print(f"\n{tcg}:")
            print(f"  Marketplace principal: {rec['primary']}")
            if rec['secondary']:
                print(f"  Marketplace secundario: {rec['secondary']}")
            print(f"  Sets recomendados: {', '.join(rec['sets'])}")
            print(f"  Cartas por set: {rec['cards_per_set']}")

if __name__ == "__main__":
    main() 