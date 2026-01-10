#!/usr/bin/env python3
"""
Script para cargar datos completos de cada TCG desde APIs externas
y almacenarlos en Supabase
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from supabase_apis import TCGDatabaseAPI
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class TCGDataLoader:
    def __init__(self):
        self.api = TCGDatabaseAPI()
        self.session = None
        
        # Configuración de APIs externas
        self.external_apis = {
            'MTG': {
                'base_url': 'https://api.scryfall.com',
                'rate_limit': 10,  # requests per second
                'endpoints': {
                    'sets': '/sets',
                    'cards': '/cards/search',
                    'card': '/cards/{id}'
                }
            },
            'POKEMON': {
                'base_url': 'https://api.pokemontcg.io/v2',
                'rate_limit': 5,
                'api_key': os.getenv('POKEMON_API_KEY'),
                'endpoints': {
                    'sets': '/sets',
                    'cards': '/cards'
                }
            }
        }
    
    async def __aenter__(self):
        """Context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.session:
            await self.session.close()
    
    async def load_mtg_data(self, limit_sets: int = None):
        """Cargar datos de Magic: The Gathering desde Scryfall"""
        print("🔮 Cargando datos de Magic: The Gathering...")
        
        try:
            # Obtener sets
            sets_url = f"{self.external_apis['MTG']['base_url']}/sets"
            async with self.session.get(sets_url) as response:
                if response.status == 200:
                    sets_data = await response.json()
                    sets = sets_data.get('data', [])
                    
                    if limit_sets:
                        sets = sets[:limit_sets]
                    
                    print(f"📦 Encontrados {len(sets)} sets de MTG")
                    
                    # Filtrar sets digitales y promocionales
                    physical_sets = [s for s in sets if not s.get('digital', False) and s.get('set_type') != 'promo']
                    print(f"📦 {len(physical_sets)} sets físicos")
                    
                    # Insertar sets en la base de datos
                    for set_data in physical_sets:
                        await self.insert_mtg_set(set_data)
                        await asyncio.sleep(0.1)  # Rate limiting
                    
                    # Cargar cartas de los sets principales
                    main_sets = [s for s in physical_sets if s.get('set_type') in ['core', 'expansion', 'commander']]
                    for set_data in main_sets[:5]:  # Limitar a 5 sets para prueba
                        await self.load_mtg_cards_from_set(set_data)
                        await asyncio.sleep(1)  # Pausa entre sets
                
        except Exception as e:
            print(f"❌ Error cargando datos de MTG: {e}")
    
    async def insert_mtg_set(self, set_data: Dict):
        """Insertar set de MTG en la base de datos"""
        try:
            # Obtener game_id de MTG
            mtg_game = self.api.get_game_by_code('MTG')
            if not mtg_game:
                print("❌ Juego MTG no encontrado en la base de datos")
                return
            
            set_record = {
                'game_id': mtg_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['code'],
                'release_date': set_data.get('released_at'),
                'total_cards': set_data.get('card_count'),
                'is_digital': set_data.get('digital', False),
                'is_promo': set_data.get('set_type') == 'promo'
            }
            
            # Verificar si el set ya existe
            existing_set = self.api.get_set_by_code('MTG', set_data['code'])
            if not existing_set:
                self.api.create_set(set_record)
                print(f"✅ Set {set_data['name']} ({set_data['code']}) insertado")
            else:
                print(f"⚠️ Set {set_data['name']} ya existe")
                
        except Exception as e:
            print(f"❌ Error insertando set {set_data.get('name', 'Unknown')}: {e}")
    
    async def load_mtg_cards_from_set(self, set_data: Dict):
        """Cargar cartas de un set específico de MTG"""
        try:
            print(f"🎴 Cargando cartas del set {set_data['name']}...")
            
            # Buscar cartas del set
            search_query = f"set:{set_data['code']}"
            cards_url = f"{self.external_apis['MTG']['base_url']}/cards/search"
            params = {'q': search_query}
            
            async with self.session.get(cards_url, params=params) as response:
                if response.status == 200:
                    cards_data = await response.json()
                    cards = cards_data.get('data', [])
                    
                    print(f"🎴 Encontradas {len(cards)} cartas en {set_data['name']}")
                    
                    # Obtener set_id
                    set_record = self.api.get_set_by_code('MTG', set_data['code'])
                    if not set_record:
                        print(f"❌ Set {set_data['code']} no encontrado en la base de datos")
                        return
                    
                    # Insertar cartas
                    for card_data in cards[:50]:  # Limitar a 50 cartas por set para prueba
                        await self.insert_mtg_card(card_data, set_record['set_id'])
                        await asyncio.sleep(0.05)  # Rate limiting
                
        except Exception as e:
            print(f"❌ Error cargando cartas del set {set_data.get('name', 'Unknown')}: {e}")
    
    async def insert_mtg_card(self, card_data: Dict, set_id: int):
        """Insertar carta de MTG en la base de datos"""
        try:
            # Obtener game_id de MTG
            mtg_game = self.api.get_game_by_code('MTG')
            if not mtg_game:
                return
            
            # Crear registro de carta
            card_record = {
                'game_id': mtg_game['game_id'],
                'card_name': card_data['name'],
                'type_line': card_data.get('type_line'),
                'oracle_text': card_data.get('oracle_text'),
                'mana_cost': card_data.get('mana_cost'),
                'power': card_data.get('power'),
                'toughness': card_data.get('toughness'),
                'base_rarity': card_data.get('rarity'),
                'loyalty': card_data.get('loyalty'),
                'api_source_id': card_data.get('id'),
                'tcg_specific_attributes': {
                    'colors': card_data.get('colors', []),
                    'color_identity': card_data.get('color_identity', []),
                    'cmc': card_data.get('cmc'),
                    'keywords': card_data.get('keywords', []),
                    'legalities': card_data.get('legalities', {}),
                    'frame_effects': card_data.get('frame_effects', []),
                    'produced_mana': card_data.get('produced_mana', [])
                }
            }
            
            # Verificar si la carta ya existe
            existing_card = self.api.get_card_by_name('MTG', card_data['name'])
            if not existing_card:
                card_record = self.api.create_card(card_record)
                card_id = card_record['card_id']
                print(f"✅ Carta {card_data['name']} insertada")
            else:
                card_id = existing_card['card_id']
                print(f"⚠️ Carta {card_data['name']} ya existe")
            
            # Crear impresión
            printing_record = {
                'card_id': card_id,
                'set_id': set_id,
                'collector_number': card_data.get('collector_number'),
                'rarity': card_data.get('rarity'),
                'is_foil': card_data.get('foil', False),
                'is_non_foil': card_data.get('nonfoil', True),
                'artist': card_data.get('artist'),
                'api_source_id': card_data.get('id')
            }
            
            # Añadir URLs de imágenes
            if 'image_uris' in card_data:
                image_uris = card_data['image_uris']
                printing_record.update({
                    'image_url_small': image_uris.get('small'),
                    'image_url_normal': image_uris.get('normal'),
                    'image_url_large': image_uris.get('large')
                })
            
            # Verificar si la impresión ya existe
            existing_printings = self.api.get_card_printings(card_id, set_id)
            printing_exists = any(p['collector_number'] == card_data.get('collector_number') for p in existing_printings)
            
            if not printing_exists:
                self.api.create_printing(printing_record)
                print(f"✅ Impresión de {card_data['name']} insertada")
            
        except Exception as e:
            print(f"❌ Error insertando carta {card_data.get('name', 'Unknown')}: {e}")
    
    async def load_pokemon_data(self, limit_sets: int = None):
        """Cargar datos de Pokémon desde la API oficial"""
        print("⚡ Cargando datos de Pokémon...")
        
        try:
            # Obtener sets
            sets_url = f"{self.external_apis['POKEMON']['base_url']}/sets"
            headers = {}
            if self.external_apis['POKEMON']['api_key']:
                headers['X-Api-Key'] = self.external_apis['POKEMON']['api_key']
            
            async with self.session.get(sets_url, headers=headers) as response:
                if response.status == 200:
                    sets_data = await response.json()
                    sets = sets_data.get('data', [])
                    
                    if limit_sets:
                        sets = sets[:limit_sets]
                    
                    print(f"📦 Encontrados {len(sets)} sets de Pokémon")
                    
                    # Insertar sets
                    for set_data in sets[:5]:  # Limitar a 5 sets para prueba
                        await self.insert_pokemon_set(set_data)
                        await asyncio.sleep(0.2)
                    
                    # Cargar cartas de los sets principales
                    for set_data in sets[:3]:  # Limitar a 3 sets para prueba
                        await self.load_pokemon_cards_from_set(set_data)
                        await asyncio.sleep(1)
                
        except Exception as e:
            print(f"❌ Error cargando datos de Pokémon: {e}")
    
    async def insert_pokemon_set(self, set_data: Dict):
        """Insertar set de Pokémon en la base de datos"""
        try:
            # Obtener game_id de Pokémon
            pokemon_game = self.api.get_game_by_code('POKEMON')
            if not pokemon_game:
                print("❌ Juego Pokémon no encontrado en la base de datos")
                return
            
            set_record = {
                'game_id': pokemon_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['id'],
                'release_date': set_data.get('releaseDate'),
                'total_cards': set_data.get('printedTotal'),
                'is_digital': False,
                'is_promo': set_data.get('series', '').lower() == 'promo'
            }
            
            # Verificar si el set ya existe
            existing_set = self.api.get_set_by_code('POKEMON', set_data['id'])
            if not existing_set:
                self.api.create_set(set_record)
                print(f"✅ Set {set_data['name']} ({set_data['id']}) insertado")
            else:
                print(f"⚠️ Set {set_data['name']} ya existe")
                
        except Exception as e:
            print(f"❌ Error insertando set {set_data.get('name', 'Unknown')}: {e}")
    
    async def load_pokemon_cards_from_set(self, set_data: Dict):
        """Cargar cartas de un set específico de Pokémon"""
        try:
            print(f"🎴 Cargando cartas del set {set_data['name']}...")
            
            # Buscar cartas del set
            cards_url = f"{self.external_apis['POKEMON']['base_url']}/cards"
            params = {'q': f'set.id:{set_data["id"]}', 'pageSize': 250}
            headers = {}
            if self.external_apis['POKEMON']['api_key']:
                headers['X-Api-Key'] = self.external_apis['POKEMON']['api_key']
            
            async with self.session.get(cards_url, params=params, headers=headers) as response:
                if response.status == 200:
                    cards_data = await response.json()
                    cards = cards_data.get('data', [])
                    
                    print(f"🎴 Encontradas {len(cards)} cartas en {set_data['name']}")
                    
                    # Obtener set_id
                    set_record = self.api.get_set_by_code('POKEMON', set_data['id'])
                    if not set_record:
                        print(f"❌ Set {set_data['id']} no encontrado en la base de datos")
                        return
                    
                    # Insertar cartas
                    for card_data in cards[:50]:  # Limitar a 50 cartas por set para prueba
                        await self.insert_pokemon_card(card_data, set_record['set_id'])
                        await asyncio.sleep(0.1)  # Rate limiting
                
        except Exception as e:
            print(f"❌ Error cargando cartas del set {set_data.get('name', 'Unknown')}: {e}")
    
    async def insert_pokemon_card(self, card_data: Dict, set_id: int):
        """Insertar carta de Pokémon en la base de datos"""
        try:
            # Obtener game_id de Pokémon
            pokemon_game = self.api.get_game_by_code('POKEMON')
            if not pokemon_game:
                return
            
            # Crear registro de carta
            card_record = {
                'game_id': pokemon_game['game_id'],
                'card_name': card_data['name'],
                'type_line': f"{card_data.get('supertype', '')} - {', '.join(card_data.get('subtypes', []))}",
                'oracle_text': card_data.get('rules', []),
                'base_rarity': card_data.get('rarity'),
                'hp': card_data.get('hp'),
                'level': card_data.get('level'),
                'api_source_id': card_data.get('id'),
                'tcg_specific_attributes': {
                    'supertype': card_data.get('supertype'),
                    'subtypes': card_data.get('subtypes', []),
                    'types': card_data.get('types', []),
                    'attacks': card_data.get('attacks', []),
                    'weaknesses': card_data.get('weaknesses', []),
                    'resistances': card_data.get('resistances', []),
                    'retreat_cost': card_data.get('convertedRetreatCost'),
                    'national_pokedex_numbers': card_data.get('nationalPokedexNumbers', [])
                }
            }
            
            # Verificar si la carta ya existe
            existing_card = self.api.get_card_by_name('POKEMON', card_data['name'])
            if not existing_card:
                card_record = self.api.create_card(card_record)
                card_id = card_record['card_id']
                print(f"✅ Carta {card_data['name']} insertada")
            else:
                card_id = existing_card['card_id']
                print(f"⚠️ Carta {card_data['name']} ya existe")
            
            # Crear impresión
            printing_record = {
                'card_id': card_id,
                'set_id': set_id,
                'collector_number': card_data.get('number'),
                'rarity': card_data.get('rarity'),
                'is_foil': False,  # Por defecto
                'is_non_foil': True,
                'artist': card_data.get('artist'),
                'api_source_id': card_data.get('id')
            }
            
            # Añadir URLs de imágenes
            if 'images' in card_data:
                images = card_data['images']
                printing_record.update({
                    'image_url_small': images.get('small'),
                    'image_url_normal': images.get('large'),
                    'image_url_large': images.get('large')
                })
            
            # Verificar si la impresión ya existe
            existing_printings = self.api.get_card_printings(card_id, set_id)
            printing_exists = any(p['collector_number'] == card_data.get('number') for p in existing_printings)
            
            if not printing_exists:
                self.api.create_printing(printing_record)
                print(f"✅ Impresión de {card_data['name']} insertada")
            
        except Exception as e:
            print(f"❌ Error insertando carta {card_data.get('name', 'Unknown')}: {e}")
    
    async def load_sample_data(self):
        """Cargar datos de muestra para todos los TCGs"""
        print("🚀 Iniciando carga de datos de muestra...")
        
        # Cargar datos de MTG
        await self.load_mtg_data(limit_sets=5)
        
        # Cargar datos de Pokémon
        await self.load_pokemon_data(limit_sets=3)
        
        # Para otros TCGs, crear datos de muestra
        await self.create_sample_data_for_other_tcgs()
        
        print("✅ Carga de datos de muestra completada")
    
    async def create_sample_data_for_other_tcgs(self):
        """Crear datos de muestra para otros TCGs"""
        print("🎲 Creando datos de muestra para otros TCGs...")
        
        # Datos de muestra para Lorcana
        await self.create_lorcana_sample_data()
        
        # Datos de muestra para FAB
        await self.create_fab_sample_data()
        
        # Datos de muestra para Yu-Gi-Oh!
        await self.create_yugioh_sample_data()
        
        # Datos de muestra para One Piece
        await self.create_onepiece_sample_data()
        
        # Datos de muestra para Wixoss
        await self.create_wixoss_sample_data()
    
    async def create_lorcana_sample_data(self):
        """Crear datos de muestra para Lorcana"""
        print("🎨 Creando datos de muestra para Lorcana...")
        
        lorcana_game = self.api.get_game_by_code('LORCANA')
        if not lorcana_game:
            return
        
        # Crear sets de muestra
        lorcana_sets = [
            {'name': 'The First Chapter', 'code': 'TFC', 'cards': 204},
            {'name': 'Rise of the Floodborn', 'code': 'ROF', 'cards': 204}
        ]
        
        for set_data in lorcana_sets:
            set_record = {
                'game_id': lorcana_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['code'],
                'total_cards': set_data['cards']
            }
            
            existing_set = self.api.get_set_by_code('LORCANA', set_data['code'])
            if not existing_set:
                set_record = self.api.create_set(set_record)
                set_id = set_record['set_id']
                
                # Crear cartas de muestra
                sample_cards = [
                    {'name': 'Mickey Mouse', 'type': 'Character', 'ink_cost': 1, 'strength': 1, 'willpower': 1},
                    {'name': 'Donald Duck', 'type': 'Character', 'ink_cost': 2, 'strength': 2, 'willpower': 2},
                    {'name': 'Goofy', 'type': 'Character', 'ink_cost': 3, 'strength': 3, 'willpower': 3},
                    {'name': 'Belle', 'type': 'Character', 'ink_cost': 4, 'strength': 4, 'willpower': 4},
                    {'name': 'Beast', 'type': 'Character', 'ink_cost': 5, 'strength': 5, 'willpower': 5}
                ]
                
                for i, card_data in enumerate(sample_cards):
                    card_record = {
                        'game_id': lorcana_game['game_id'],
                        'card_name': card_data['name'],
                        'type_line': f"Character - {card_data['type']}",
                        'base_rarity': 'Common',
                        'tcg_specific_attributes': {
                            'ink_cost': card_data['ink_cost'],
                            'strength': card_data['strength'],
                            'willpower': card_data['willpower'],
                            'ink_color': 'Amber'
                        }
                    }
                    
                    card_record = self.api.create_card(card_record)
                    
                    printing_record = {
                        'card_id': card_record['card_id'],
                        'set_id': set_id,
                        'collector_number': str(i + 1),
                        'rarity': 'Common',
                        'is_foil': False,
                        'is_non_foil': True
                    }
                    
                    self.api.create_printing(printing_record)
                
                print(f"✅ Set {set_data['name']} con {len(sample_cards)} cartas creado")
    
    async def create_fab_sample_data(self):
        """Crear datos de muestra para Flesh and Blood"""
        print("⚔️ Creando datos de muestra para Flesh and Blood...")
        
        fab_game = self.api.get_game_by_code('FAB')
        if not fab_game:
            return
        
        # Crear sets de muestra
        fab_sets = [
            {'name': 'Welcome to Rathe', 'code': 'WTR', 'cards': 318},
            {'name': 'Arcane Rising', 'code': 'ARC', 'cards': 318}
        ]
        
        for set_data in fab_sets:
            set_record = {
                'game_id': fab_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['code'],
                'total_cards': set_data['cards']
            }
            
            existing_set = self.api.get_set_by_code('FAB', set_data['code'])
            if not existing_set:
                set_record = self.api.create_set(set_record)
                set_id = set_record['set_id']
                
                # Crear cartas de muestra
                sample_cards = [
                    {'name': 'Bravo', 'type': 'Hero', 'pitch': 3, 'class': 'Guardian'},
                    {'name': 'Dorinthea', 'type': 'Hero', 'pitch': 3, 'class': 'Warrior'},
                    {'name': 'Katsu', 'type': 'Hero', 'pitch': 3, 'class': 'Ninja'},
                    {'name': 'Rhinar', 'type': 'Hero', 'pitch': 3, 'class': 'Brute'},
                    {'name': 'Viserai', 'type': 'Hero', 'pitch': 3, 'class': 'Runeblade'}
                ]
                
                for i, card_data in enumerate(sample_cards):
                    card_record = {
                        'game_id': fab_game['game_id'],
                        'card_name': card_data['name'],
                        'type_line': f"Hero - {card_data['class']}",
                        'base_rarity': 'Legendary',
                        'tcg_specific_attributes': {
                            'pitch': card_data['pitch'],
                            'class': card_data['class'],
                            'life': 20,
                            'intellect': 4
                        }
                    }
                    
                    card_record = self.api.create_card(card_record)
                    
                    printing_record = {
                        'card_id': card_record['card_id'],
                        'set_id': set_id,
                        'collector_number': f"L{i + 1}",
                        'rarity': 'Legendary',
                        'is_foil': True,
                        'is_non_foil': False
                    }
                    
                    self.api.create_printing(printing_record)
                
                print(f"✅ Set {set_data['name']} con {len(sample_cards)} cartas creado")
    
    async def create_yugioh_sample_data(self):
        """Crear datos de muestra para Yu-Gi-Oh!"""
        print("🐉 Creando datos de muestra para Yu-Gi-Oh!...")
        
        yugioh_game = self.api.get_game_by_code('YUGIOH')
        if not yugioh_game:
            return
        
        # Crear sets de muestra
        yugioh_sets = [
            {'name': 'Legend of Blue Eyes White Dragon', 'code': 'LOB', 'cards': 126},
            {'name': 'Metal Raiders', 'code': 'MRD', 'cards': 126}
        ]
        
        for set_data in yugioh_sets:
            set_record = {
                'game_id': yugioh_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['code'],
                'total_cards': set_data['cards']
            }
            
            existing_set = self.api.get_set_by_code('YUGIOH', set_data['code'])
            if not existing_set:
                set_record = self.api.create_set(set_record)
                set_id = set_record['set_id']
                
                # Crear cartas de muestra
                sample_cards = [
                    {'name': 'Blue-Eyes White Dragon', 'type': 'Monster', 'level': 8, 'atk': 3000, 'def': 2500},
                    {'name': 'Dark Magician', 'type': 'Monster', 'level': 7, 'atk': 2500, 'def': 2100},
                    {'name': 'Summoned Skull', 'type': 'Monster', 'level': 6, 'atk': 2500, 'def': 1200},
                    {'name': 'Red-Eyes Black Dragon', 'type': 'Monster', 'level': 7, 'atk': 2400, 'def': 2000},
                    {'name': 'Exodia the Forbidden One', 'type': 'Monster', 'level': 3, 'atk': 1000, 'def': 1000}
                ]
                
                for i, card_data in enumerate(sample_cards):
                    card_record = {
                        'game_id': yugioh_game['game_id'],
                        'card_name': card_data['name'],
                        'type_line': f"Monster - {card_data['type']}",
                        'base_rarity': 'Ultra Rare',
                        'level': card_data['level'],
                        'tcg_specific_attributes': {
                            'atk': card_data['atk'],
                            'def': card_data['def'],
                            'attribute': 'DARK',
                            'race': 'Dragon'
                        }
                    }
                    
                    card_record = self.api.create_card(card_record)
                    
                    printing_record = {
                        'card_id': card_record['card_id'],
                        'set_id': set_id,
                        'collector_number': str(i + 1),
                        'rarity': 'Ultra Rare',
                        'is_foil': True,
                        'is_non_foil': False
                    }
                    
                    self.api.create_printing(printing_record)
                
                print(f"✅ Set {set_data['name']} con {len(sample_cards)} cartas creado")
    
    async def create_onepiece_sample_data(self):
        """Crear datos de muestra para One Piece"""
        print("🏴‍☠️ Creando datos de muestra para One Piece...")
        
        onepiece_game = self.api.get_game_by_code('ONEPIECE')
        if not onepiece_game:
            return
        
        # Crear sets de muestra
        onepiece_sets = [
            {'name': 'Romance Dawn', 'code': 'OP01', 'cards': 121},
            {'name': 'Paramount War', 'code': 'OP02', 'cards': 121}
        ]
        
        for set_data in onepiece_sets:
            set_record = {
                'game_id': onepiece_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['code'],
                'total_cards': set_data['cards']
            }
            
            existing_set = self.api.get_set_by_code('ONEPIECE', set_data['code'])
            if not existing_set:
                set_record = self.api.create_set(set_record)
                set_id = set_record['set_id']
                
                # Crear cartas de muestra
                sample_cards = [
                    {'name': 'Monkey D. Luffy', 'type': 'Leader', 'cost': 5, 'power': 5000},
                    {'name': 'Roronoa Zoro', 'type': 'Character', 'cost': 4, 'power': 4000},
                    {'name': 'Nami', 'type': 'Character', 'cost': 3, 'power': 3000},
                    {'name': 'Usopp', 'type': 'Character', 'cost': 2, 'power': 2000},
                    {'name': 'Sanji', 'type': 'Character', 'cost': 4, 'power': 4000}
                ]
                
                for i, card_data in enumerate(sample_cards):
                    card_record = {
                        'game_id': onepiece_game['game_id'],
                        'card_name': card_data['name'],
                        'type_line': f"Character - {card_data['type']}",
                        'base_rarity': 'Common',
                        'tcg_specific_attributes': {
                            'cost': card_data['cost'],
                            'power': card_data['power'],
                            'color': 'Red',
                            'counter': 1000
                        }
                    }
                    
                    card_record = self.api.create_card(card_record)
                    
                    printing_record = {
                        'card_id': card_record['card_id'],
                        'set_id': set_id,
                        'collector_number': str(i + 1),
                        'rarity': 'Common',
                        'is_foil': False,
                        'is_non_foil': True
                    }
                    
                    self.api.create_printing(printing_record)
                
                print(f"✅ Set {set_data['name']} con {len(sample_cards)} cartas creado")
    
    async def create_wixoss_sample_data(self):
        """Crear datos de muestra para Wixoss"""
        print("🎭 Creando datos de muestra para Wixoss...")
        
        wixoss_game = self.api.get_game_by_code('WIXOSS')
        if not wixoss_game:
            return
        
        # Crear sets de muestra
        wixoss_sets = [
            {'name': 'Diva', 'code': 'DIVA', 'cards': 100},
            {'name': 'Diva Duel', 'code': 'DIVA2', 'cards': 100}
        ]
        
        for set_data in wixoss_sets:
            set_record = {
                'game_id': wixoss_game['game_id'],
                'set_name': set_data['name'],
                'set_code': set_data['code'],
                'total_cards': set_data['cards']
            }
            
            existing_set = self.api.get_set_by_code('WIXOSS', set_data['code'])
            if not existing_set:
                set_record = self.api.create_set(set_record)
                set_id = set_record['set_id']
                
                # Crear cartas de muestra
                sample_cards = [
                    {'name': 'Tama', 'type': 'LRIG', 'level': 1, 'color': 'Red'},
                    {'name': 'Yuki', 'type': 'LRIG', 'level': 1, 'color': 'Blue'},
                    {'name': 'Ru', 'type': 'LRIG', 'level': 1, 'color': 'Green'},
                    {'name': 'Aki', 'type': 'LRIG', 'level': 1, 'color': 'Yellow'},
                    {'name': 'Iona', 'type': 'LRIG', 'level': 1, 'color': 'White'}
                ]
                
                for i, card_data in enumerate(sample_cards):
                    card_record = {
                        'game_id': wixoss_game['game_id'],
                        'card_name': card_data['name'],
                        'type_line': f"LRIG - {card_data['type']}",
                        'base_rarity': 'Common',
                        'level': card_data['level'],
                        'tcg_specific_attributes': {
                            'color': card_data['color'],
                            'limit': 4,
                            'grow_cost': 1,
                            'life_burst': True
                        }
                    }
                    
                    card_record = self.api.create_card(card_record)
                    
                    printing_record = {
                        'card_id': card_record['card_id'],
                        'set_id': set_id,
                        'collector_number': str(i + 1),
                        'rarity': 'Common',
                        'is_foil': False,
                        'is_non_foil': True
                    }
                    
                    self.api.create_printing(printing_record)
                
                print(f"✅ Set {set_data['name']} con {len(sample_cards)} cartas creado")

async def main():
    """Función principal"""
    print("🚀 Iniciando carga de datos TCG...")
    
    async with TCGDataLoader() as loader:
        # Cargar datos de muestra
        await loader.load_sample_data()
        
        print("🎉 ¡Carga de datos completada!")

if __name__ == "__main__":
    asyncio.run(main()) 