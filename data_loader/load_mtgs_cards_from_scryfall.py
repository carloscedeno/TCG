#!/usr/bin/env python3
"""
Carga todas las cartas de Magic: The Gathering desde Scryfall para cada set en la tabla 'sets' (game_id=22),
y las inserta en las tablas 'cards' y 'card_printings' de Supabase.

- Usa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY desde .env o variables de entorno.
- Es idempotente y seguro para re-ejecutar.
- Imprime un resumen de la operación.
- Pobla todos los campos relevantes de Scryfall (arrays, jsonb, fechas, layouts, etc).

Uso:
    python data_loader/load_mtgs_cards_from_scryfall.py
"""
import os
import requests
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Cargar variables de entorno
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GAME_ID = 22  # MTG

assert SUPABASE_URL and SUPABASE_KEY, "Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu entorno/.env"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SCRYFALL_CARDS_URL = "https://api.scryfall.com/cards/search?q=e%3A{set_code}&unique=prints"

# Mapeo de campos Scryfall -> DB para 'cards'
def map_scryfall_card(card):
    return {
        'card_id': card['oracle_id'],
        'game_id': GAME_ID,
        'card_name': card['name'],
        'type_line': card.get('type_line'),
        'oracle_text': card.get('oracle_text'),
        'mana_cost': card.get('mana_cost'),
        'power': card.get('power'),
        'toughness': card.get('toughness'),
        'rarity': card.get('rarity'),
        'artist': card.get('artist'),
        'cmc': card.get('cmc'),
        'colors': card.get('colors'),
        'color_identity': card.get('color_identity'),
        'layout': card.get('layout'),
        'edhrec_rank': card.get('edhrec_rank'),
        'legalities': card.get('legalities'),
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
    }

# Mapeo de campos Scryfall -> DB para 'card_printings'
def map_scryfall_printing(card, set_id):
    return {
        'printing_id': card['id'],
        'card_id': card['oracle_id'],
        'set_id': set_id,
        'set_code': card.get('set'),
        'collector_number': card.get('collector_number'),
        'lang': card.get('lang'),
        'flavor_text': card.get('flavor_text'),
        'image_url': card.get('image_uris', {}).get('normal') if card.get('image_uris') else None,
        'released_at': card.get('released_at'),
        'is_foil': card.get('foil', False),
        'is_nonfoil': card.get('nonfoil', False),
        'is_promo': card.get('promo', False),
        'is_reprint': card.get('reprint', False),
        'prices': card.get('prices'),
        'related_uris': card.get('related_uris'),
        'all_parts': card.get('all_parts'),
        'card_faces': card.get('card_faces'),
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
    }

def get_all_cards_for_set(set_code):
    """Descarga todas las cartas de un set de Scryfall (maneja paginación). Si el set no existe (404), retorna None."""
    cards = []
    url = SCRYFALL_CARDS_URL.format(set_code=set_code)
    headers = {
        'User-Agent': 'TCGWebApp/1.0 (contact: tu-email@ejemplo.com)',
        'Accept': 'application/json'
    }
    while url:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 404:
            return None  # Set no encontrado en Scryfall
        resp.raise_for_status()
        data = resp.json()
        cards.extend(data['data'])
        url = data.get('next_page')
        time.sleep(0.1)  # Para evitar rate limit
    return cards

def main():
    print("Obteniendo sets de MTG desde la base de datos...")
    sets_resp = supabase.table('sets').select('set_id,set_code').eq('game_id', GAME_ID).execute()
    sets = sets_resp.data
    print(f"Sets de MTG encontrados: {len(sets)}")

    # Limitar a los primeros 3 sets para pruebas rápidas
    sets = sets[:3]  # Quita esta línea para procesar todos los sets

    total_cards, total_printings, skipped_sets = 0, 0, 0
    for s in sets:
        set_id = s['set_id']
        set_code = s['set_code']
        print(f"Procesando set {set_code} (ID {set_id})...")
        cards = get_all_cards_for_set(set_code)
        if cards is None:
            print(f"  ⚠️  Set {set_code} no tiene cartas en Scryfall o no existe. Saltando...")
            skipped_sets += 1
            continue
        print(f"  Cartas encontradas: {len(cards)}")
        for card in cards:
            # Insertar/actualizar card
            card_data = map_scryfall_card(card)
            card_id = card_data['card_id']
            existing_card = supabase.table('cards').select('card_id').eq('card_id', card_id).execute()
            if existing_card.data and len(existing_card.data) > 0:
                supabase.table('cards').update(card_data).eq('card_id', card_id).execute()
            else:
                supabase.table('cards').insert(card_data).execute()
            total_cards += 1
            # Insertar/actualizar printing
            printing_data = map_scryfall_printing(card, set_id)
            printing_id = printing_data['printing_id']
            existing_printing = supabase.table('card_printings').select('printing_id').eq('printing_id', printing_id).execute()
            if existing_printing.data and len(existing_printing.data) > 0:
                supabase.table('card_printings').update(printing_data).eq('printing_id', printing_id).execute()
            else:
                supabase.table('card_printings').insert(printing_data).execute()
            total_printings += 1
        print(f"  Cartas procesadas: {len(cards)}")
    print(f"Total de cartas insertadas/actualizadas: {total_cards}")
    print(f"Total de impresiones insertadas/actualizadas: {total_printings}")
    print(f"Sets omitidos por no tener cartas: {skipped_sets}")
    print("¡Carga de cartas de MTG completada!")

if __name__ == "__main__":
    main() 