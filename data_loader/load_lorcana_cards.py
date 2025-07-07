#!/usr/bin/env python3
"""
Carga cartas de Lorcana desde la API pública de Dreamborn Ink y las inserta en Supabase.
"""
import requests
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# Cargar variables de entorno
load_dotenv(dotenv_path='.env', override=True)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados en .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

CARDWISE_API = "https://api.cardwise.itodorova.dev/lorcana/cards"
GAME_CODE = "LORCANA"


def fetch_lorcana_cards():
    print("Descargando cartas de Lorcana desde Cardwise API...")
    resp = requests.get(CARDWISE_API)
    resp.raise_for_status()
    data = resp.json()
    cards = data['cards'] if 'cards' in data else data
    print(f"Total de cartas encontradas: {len(cards)}")
    return cards


def normalize_card(card):
    # Normaliza los campos principales para la tabla 'cards' y 'card_printings'
    card_id = f"lorcana_{card['id']}"
    printing_id = f"lorcana_{card['id']}_{card.get('set', 'unknown')}"
    return {
        'card': {
            'card_id': card_id,
            'game_id': get_game_id(GAME_CODE),
            'card_name': card['name'],
            'type_line': card.get('type', ''),
            'base_rarity': card.get('rarity', ''),
            'tcg_specific_attributes': {
                'ink': card.get('ink'),
                'cost': card.get('cost'),
                'strength': card.get('strength'),
                'willpower': card.get('willpower'),
                'lore': card.get('lore'),
                'flavor': card.get('flavor'),
                'artist': card.get('artist'),
                'set': card.get('set'),
                'number': card.get('number'),
                'illustration_id': card.get('illustration_id'),
            },
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
        },
        'printing': {
            'printing_id': printing_id,
            'card_id': card_id,
            'set_id': get_set_id(card.get('set', 'unknown')),
            'collector_number': card.get('number'),
            'lang': 'en',
            'is_token': False,
            'is_emblem': False,
            'tcgplayer_id': None,
            'scryfall_id': None,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
        }
    }

def get_game_id(game_code):
    # Busca el game_id en la tabla games
    res = supabase.table('games').select('game_id').eq('game_code', game_code).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]['game_id']
    raise ValueError(f"No se encontró game_id para {game_code}")

def get_set_id(set_code):
    # Busca el set_id en la tabla sets
    res = supabase.table('sets').select('set_id').eq('set_code', set_code).eq('game_id', get_game_id(GAME_CODE)).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]['set_id']
    # Si no existe, crea el set mínimo
    new_set = {
        'set_code': set_code,
        'game_id': get_game_id(GAME_CODE),
        'set_name': set_code,
        'is_digital': False,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
    }
    res = supabase.table('sets').insert(new_set).execute()
    return res.data[0]['set_id']

def upsert_card(card_data):
    # Inserta o actualiza la carta
    card = card_data['card']
    printing = card_data['printing']
    # Upsert en cards
    supabase.table('cards').upsert(card).execute()
    # Upsert en card_printings
    supabase.table('card_printings').upsert(printing).execute()

def main():
    cards = fetch_lorcana_cards()
    total, nuevos, actualizados = 0, 0, 0
    for card in cards:
        try:
            card_data = normalize_card(card)
            upsert_card(card_data)
            total += 1
            if total % 50 == 0:
                print(f"Procesadas {total} cartas...")
        except Exception as e:
            print(f"⚠️  Error procesando carta {card.get('name')}: {e}")
    print(f"¡Carga de cartas de Lorcana completada! Total procesadas: {total}")

if __name__ == "__main__":
    main() 