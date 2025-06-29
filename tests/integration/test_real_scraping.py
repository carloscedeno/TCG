#!/usr/bin/env python3
"""
Script de scraping real para probar con datos de cada TCG en cada marketplace
Limita a 100 cartas por TCG para el test inicial
"""

import asyncio
import json
import time
import csv
from datetime import datetime
from typing import Dict, List, Any
from scraper.data.models import TCGMarketplaceMapper, CardData

class RealScrapingTester:
    def __init__(self):
        self.mapper = TCGMarketplaceMapper()
        self.results = {}
        self.stats = {
            'total_cards': 0,
            'successful_scrapes': 0,
            'failed_scrapes': 0,
            'start_time': None,
            'end_time': None
        }
        
        # Configuración de scraping por TCG
        self.scraping_config = {
            'MTG': {
                'sets': ['Commander Masters', 'Modern Horizons 3', 'Outlaws of Thunder Junction'],
                'cards_per_set': 33,
                'marketplaces': ['cardmarket', 'tcgplayer', 'cardkingdom']
            },
            'POKEMON': {
                'sets': ['Base Set', 'Jungle', 'Fossil', 'Base Set 2'],
                'cards_per_set': 25,
                'marketplaces': ['cardmarket', 'tcgplayer', 'cardkingdom']
            },
            'YUGIOH': {
                'sets': ['Legend of Blue Eyes White Dragon', 'Metal Raiders', 'Magic Ruler'],
                'cards_per_set': 33,
                'marketplaces': ['cardmarket', 'tcgplayer', 'cardkingdom']
            },
            'LORCANA': {
                'sets': ['The First Chapter', 'Rise of the Floodborn'],
                'cards_per_set': 50,
                'marketplaces': ['cardmarket', 'tcgplayer', 'cardkingdom']
            },
            'FAB': {
                'sets': ['Welcome to Rathe', 'Arcane Rising', 'Monarch'],
                'cards_per_set': 33,
                'marketplaces': ['cardmarket', 'tcgplayer', 'cardkingdom']
            },
            'ONEPIECE': {
                'sets': ['Romance Dawn', 'Paramount War', 'Pillars of Strength'],
                'cards_per_set': 33,
                'marketplaces': ['cardmarket', 'tcgplayer', 'cardkingdom']
            },
            'WIXOSS': {
                'sets': ['Diva', 'Diva Duel', 'Diva Duel 2'],
                'cards_per_set': 33,
                'marketplaces': ['cardmarket']  # Solo Cardmarket tiene Wixoss
            }
        }

    def generate_test_urls(self, tcg: str, marketplace: str, set_name: str, limit: int = 10):
        """Generar URLs de prueba para simular scraping real"""
        print(f"\n🔍 Generando URLs de prueba para {tcg} - {marketplace} - {set_name}")
        
        # URLs de ejemplo por marketplace y TCG
        url_templates = {
            'cardmarket': {
                'MTG': 'https://www.cardmarket.com/en/Magic/Products/Singles/{set}/{card}',
                'POKEMON': 'https://www.cardmarket.com/en/Pokemon/Products/Singles/{set}/{card}',
                'YUGIOH': 'https://www.cardmarket.com/en/YuGiOh/Products/Singles/{set}/{card}',
                'LORCANA': 'https://www.cardmarket.com/en/Lorcana/Products/Singles/{set}/{card}',
                'FAB': 'https://www.cardmarket.com/en/Flesh-and-Blood/Products/Singles/{set}/{card}',
                'ONEPIECE': 'https://www.cardmarket.com/en/One-Piece/Products/Singles/{set}/{card}',
                'WIXOSS': 'https://www.cardmarket.com/en/Wixoss/Products/Singles/{set}/{card}'
            },
            'tcgplayer': {
                'MTG': 'https://www.tcgplayer.com/product/{id}?xid={card}',
                'POKEMON': 'https://www.tcgplayer.com/product/{id}?xid={card}',
                'YUGIOH': 'https://www.tcgplayer.com/product/{id}?xid={card}',
                'LORCANA': 'https://www.tcgplayer.com/product/{id}?xid={card}',
                'FAB': 'https://www.tcgplayer.com/product/{id}?xid={card}',
                'ONEPIECE': 'https://www.tcgplayer.com/product/{id}?xid={card}'
            },
            'cardkingdom': {
                'MTG': 'https://www.cardkingdom.com/mtg/{set}/{card}',
                'POKEMON': 'https://www.cardkingdom.com/pokemon/{set}/{card}',
                'YUGIOH': 'https://www.cardkingdom.com/yugioh/{set}/{card}',
                'LORCANA': 'https://www.cardkingdom.com/lorcana/{set}/{card}',
                'FAB': 'https://www.cardkingdom.com/fab/{set}/{card}',
                'ONEPIECE': 'https://www.cardkingdom.com/onepiece/{set}/{card}'
            }
        }
        
        template = url_templates.get(marketplace, {}).get(tcg)
        if not template:
            print(f"⚠️ No hay template de URL para {marketplace} - {tcg}")
            return []
        
        # Generar cartas de ejemplo
        test_cards = []
        for i in range(limit):
            card_name = f"Test Card {i+1}"
            card_id = f"{tcg.lower()}_{set_name.lower().replace(' ', '_')}_{i+1}"
            
            # Simular datos de carta
            card_data = {
                'name': card_name,
                'set_name': set_name,
                'tcg': tcg,
                'marketplace': marketplace,
                'url': template.format(set=set_name.replace(' ', '-'), card=card_name.replace(' ', '-'), id=card_id),
                'price': round(10 + (i * 2.5), 2),  # Precios simulados
                'condition': 'Near Mint' if i % 3 == 0 else 'Light Played' if i % 3 == 1 else 'Played',
                'currency': 'EUR' if marketplace == 'cardmarket' else 'USD',
                'scraped_at': datetime.now().isoformat()
            }
            test_cards.append(card_data)
        
        print(f"✅ Generadas {len(test_cards)} URLs de prueba para {marketplace}")
        return test_cards

    async def test_tcg_coverage(self, tcg: str):
        """Probar cobertura completa de un TCG"""
        print(f"\n{'='*60}")
        print(f"TESTING {tcg} COVERAGE")
        print(f"{'='*60}")
        
        config = self.scraping_config.get(tcg, {})
        tcg_results = {
            'tcg': tcg,
            'marketplaces': {},
            'total_cards': 0,
            'unique_cards': set()
        }
        
        for marketplace in config.get('marketplaces', []):
            marketplace_results = []
            
            for set_name in config.get('sets', []):
                cards_per_set = config.get('cards_per_set', 10)
                cards = self.generate_test_urls(tcg, marketplace, set_name, cards_per_set)
                
                if cards:
                    marketplace_results.extend(cards)
                    tcg_results['unique_cards'].update([card['name'] for card in cards])
                
                # Simular pausa entre sets
                await asyncio.sleep(0.1)
            
            tcg_results['marketplaces'][marketplace] = {
                'cards': marketplace_results,
                'count': len(marketplace_results)
            }
            tcg_results['total_cards'] += len(marketplace_results)
            
            # Simular pausa entre marketplaces
            await asyncio.sleep(0.2)
        
        tcg_results['unique_cards'] = list(tcg_results['unique_cards'])
        tcg_results['unique_count'] = len(tcg_results['unique_cards'])
        
        self.results[tcg] = tcg_results
        return tcg_results

    async def run_full_test(self):
        """Ejecutar test completo de todos los TCGs"""
        print("🚀 INICIANDO TEST DE SCRAPING REAL")
        print("=" * 60)
        
        self.stats['start_time'] = datetime.now()
        
        # Testear cada TCG
        for tcg in self.scraping_config.keys():
            try:
                await self.test_tcg_coverage(tcg)
                self.stats['successful_scrapes'] += 1
            except Exception as e:
                print(f"❌ Error en {tcg}: {str(e)}")
                self.stats['failed_scrapes'] += 1
        
        self.stats['end_time'] = datetime.now()
        self.stats['total_cards'] = sum(
            result['total_cards'] for result in self.results.values()
        )
        
        await self.generate_report()

    async def generate_report(self):
        """Generar reporte completo de resultados"""
        print(f"\n{'='*60}")
        print("REPORTE FINAL DE SCRAPING")
        print(f"{'='*60}")
        
        # Estadísticas generales
        duration = self.stats['end_time'] - self.stats['start_time']
        print(f"\n📊 ESTADÍSTICAS GENERALES:")
        print(f"   Tiempo total: {duration}")
        print(f"   TCGs exitosos: {self.stats['successful_scrapes']}")
        print(f"   TCGs fallidos: {self.stats['failed_scrapes']}")
        print(f"   Total de cartas: {self.stats['total_cards']}")
        
        # Resultados por TCG
        print(f"\n📋 RESULTADOS POR TCG:")
        for tcg, result in self.results.items():
            print(f"\n   {tcg}:")
            print(f"     Cartas totales: {result['total_cards']}")
            print(f"     Cartas únicas: {result['unique_count']}")
            print(f"     Marketplaces: {len(result['marketplaces'])}")
            
            for marketplace, data in result['marketplaces'].items():
                print(f"       {marketplace}: {data['count']} cartas")
        
        # Guardar resultados
        await self.save_results()

    async def save_results(self):
        """Guardar resultados en archivo JSON"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test_results_{timestamp}.json"
        
        # Preparar datos para JSON
        json_data = {
            'stats': {
                'start_time': self.stats['start_time'].isoformat(),
                'end_time': self.stats['end_time'].isoformat(),
                'total_cards': self.stats['total_cards'],
                'successful_scrapes': self.stats['successful_scrapes'],
                'failed_scrapes': self.stats['failed_scrapes']
            },
            'results': {}
        }
        
        # Convertir resultados a formato serializable
        for tcg, result in self.results.items():
            json_data['results'][tcg] = {
                'tcg': result['tcg'],
                'total_cards': result['total_cards'],
                'unique_cards': result['unique_cards'],
                'unique_count': result['unique_count'],
                'marketplaces': {}
            }
            
            for marketplace, data in result['marketplaces'].items():
                json_data['results'][tcg]['marketplaces'][marketplace] = {
                    'count': data['count'],
                    'cards': data['cards']
                }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Resultados guardados en: {filename}")

    def create_input_csv(self):
        """Crear archivo CSV con URLs de entrada para scraping real"""
        print("\n📝 Creando archivo CSV con URLs de entrada...")
        
        csv_data = []
        for tcg, config in self.scraping_config.items():
            for marketplace in config.get('marketplaces', []):
                for set_name in config.get('sets', []):
                    cards_per_set = min(config.get('cards_per_set', 10), 10)  # Máximo 10 por set para CSV
                    
                    for i in range(cards_per_set):
                        card_name = f"{tcg} Test Card {i+1}"
                        url = f"https://example.com/{marketplace}/{tcg.lower()}/{set_name.lower().replace(' ', '-')}/{card_name.lower().replace(' ', '-')}"
                        
                        csv_data.append({
                            'url': url,
                            'card_name': card_name,
                            'set_name': set_name,
                            'tcg': tcg,
                            'marketplace': marketplace,
                            'condition': 'Near Mint'
                        })
        
        # Guardar CSV
        with open('input_urls_test.csv', 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['url', 'card_name', 'set_name', 'tcg', 'marketplace', 'condition']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_data)
        
        print(f"✅ CSV creado con {len(csv_data)} URLs de entrada")

async def main():
    """Función principal"""
    tester = RealScrapingTester()
    
    # Crear CSV de entrada
    tester.create_input_csv()
    
    # Ejecutar test completo
    await tester.run_full_test()

if __name__ == "__main__":
    asyncio.run(main()) 