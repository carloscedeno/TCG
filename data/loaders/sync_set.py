#!/usr/bin/env python3
"""
Sincroniza un set específico de Magic: The Gathering desde Scryfall por su código.
Uso: python data/loaders/sync_set.py <set_code>
Ejemplo: python data/loaders/sync_set.py LCC
"""
import os
import sys
import argparse
import requests
import time
import random
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
GAME_ID = 22  # MTG

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL o SUPABASE_KEY no configurados.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SCRYFALL_SET_URL = "https://api.scryfall.com/sets/{code}"
SCRYFALL_CARDS_URL = "https://api.scryfall.com/cards/search?q=e%3A{code}&unique=prints"

# --- Funciones de ayuda (reutilizadas) ---
def map_scryfall_set(s):
    return {
        'game_id': GAME_ID,
        'set_name': s['name'],
        'set_code': s['code'],
        'release_date': s.get('released_at'),
        'is_digital': s.get('digital', False),
        'is_promo': s.get('set_type', '').startswith('promo'),
        'total_cards': s.get('card_count'),
        'printed_total': s.get('printed_size'),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }

def map_scryfall_card(card):
    oracle_text = card.get('oracle_text')
    type_line = card.get('type_line')
    mana_cost = card.get('mana_cost')
    
    if 'card_faces' in card and not oracle_text:
        oracle_text = " // ".join([f.get('oracle_text', '') for f in card['card_faces']])
    if 'card_faces' in card and not type_line:
        type_line = " // ".join([f.get('type_line', '') for f in card['card_faces']])
    if 'card_faces' in card and not mana_cost:
        mana_cost = " // ".join([f.get('mana_cost', '') for f in card['card_faces']])

    return {
        'card_id': card['oracle_id'],
        'game_id': GAME_ID,
        'card_name': card['name'],
        'type_line': type_line,
        'oracle_text': oracle_text,
        'mana_cost': mana_cost,
        'rarity': card.get('rarity'),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'colors': card.get('colors', []),
        'legalities': card.get('legalities', {}),
    }

def map_scryfall_printing(card, set_id):
    image_url = card.get('image_uris', {}).get('normal')
    if not image_url and 'card_faces' in card:
        image_url = card['card_faces'][0].get('image_uris', {}).get('normal')

    return {
        'printing_id': card['id'],
        'scryfall_id': card['id'],
        'card_id': card['oracle_id'],
        'set_id': set_id,
        'set_code': card.get('set'),
        'collector_number': card.get('collector_number'),
        'image_url': image_url,
        'prices': card.get('prices'),
        'card_faces': card.get('card_faces'),
        'rarity': card.get('rarity'),
        'artist': card.get('artist'),
        'flavor_text': card.get('flavor_text'),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }

def fetch_all_cards(set_code):
    cards = []
    url = SCRYFALL_CARDS_URL.format(code=set_code)
    
    while url:
        print(f"  🔍 Consultando: {url}")
        resp = requests.get(url)
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        data = resp.json()
        cards.extend(data.get('data', []))
        if data.get('has_more'):
            url = data.get('next_page')
            time.sleep(0.1)
        else:
            url = None
    return cards

def main():
    parser = argparse.ArgumentParser(description="Sincronizar un set específico.")
    parser.add_argument("set_code", help="Código del set (ej: LCC)")
    args = parser.parse_args()
    set_code = args.set_code.lower()

    print(f"🚀 Iniciando sincronización del set '{set_code}'...")

    # 1. Obtener y actualizar el Set
    print("1️⃣  Verificando set en Scryfall...")
    resp = requests.get(SCRYFALL_SET_URL.format(code=set_code))
    if resp.status_code == 404:
        print(f"❌ El set '{set_code}' no existe en Scryfall.")
        sys.exit(1)
    resp.raise_for_status()
    set_data = resp.json()
    
    mapped_set = map_scryfall_set(set_data)
    
    print(f"   Upserting set '{mapped_set['set_name']}' en DB...")
    
    # Check if set exists
    existing = supabase.table('sets').select('set_id').eq('set_code', set_code).eq('game_id', GAME_ID).execute()
    
    if existing.data:
        set_id = existing.data[0]['set_id']
        print(f"   Set existente (ID: {set_id}). Actualizando...")
        supabase.table('sets').update(mapped_set).eq('set_id', set_id).execute()
    else:
        print(f"   Set nuevo. Insertando...")
        res = supabase.table('sets').insert(mapped_set).execute()
        set_id = res.data[0]['set_id']
    
    print(f"   Set ID: {set_id}")

    # 2. Obtener y actualizar Cartas
    print("2️⃣  Descargando cartas...")
    cards = fetch_all_cards(set_code)
    print(f"   {len(cards)} cartas encontradas.")

    if not cards:
        print("⚠️ No hay cartas para procesar.")
        return

    cards_to_upsert = {}
    printings_to_upsert = {}

    for card in cards:
        oracle_id = card.get('oracle_id')
        if not oracle_id and 'card_faces' in card:
            oracle_id = card['card_faces'][0].get('oracle_id')
            
        if not oracle_id:
            print(f"⚠️ Saliendo: No se encontró oracle_id para {card.get('name')} (#{card.get('collector_number')})")
            continue
        
        # Asegurar que el card object tiene el oracle_id para las funciones de mapeo
        card['oracle_id'] = oracle_id
        
        c_mapped = map_scryfall_card(card)
        cards_to_upsert[c_mapped['card_id']] = c_mapped
        
        p_mapped = map_scryfall_printing(card, set_id)
        printings_to_upsert[p_mapped['printing_id']] = p_mapped

    if cards_to_upsert:
        print(f"   Upserting {len(cards_to_upsert)} cartas (base)...")
        batch_size = 500
        card_values = list(cards_to_upsert.values())
        for i in range(0, len(card_values), batch_size):
            supabase.table('cards').upsert(card_values[i:i+batch_size], on_conflict='card_id').execute()

    if printings_to_upsert:
        print(f"   Upserting {len(printings_to_upsert)} impresiones (printings)...")
        printing_values = list(printings_to_upsert.values())
        for i in range(0, len(printing_values), batch_size):
            supabase.table('card_printings').upsert(printing_values[i:i+batch_size], on_conflict='printing_id').execute()

    print("✅ Sincronización completada con éxito.")

if __name__ == "__main__":
    main()
