#!/usr/bin/env python3
"""
Sincroniza sets específicos desde Scryfall para resolver fallos de importación.
Uso: python scripts/sync_specific_sets.py
"""
import os
import sys
import requests
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Cargar variables de entorno
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
GAME_ID = 22  # MTG

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"❌ Error: SUPABASE_URL o SUPABASE_KEY no encontrados.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Sets que el usuario reportó con fallos y que confirmé que están vacíos en la DB
TARGET_SETS = ['big', 'j25', 'm3c', 'otc', 'nec', 'sta', 'pdtk', 'fca', 'fic']

def main():
    print(f"🚀 Iniciando sincronización manual de sets específicos: {', '.join(TARGET_SETS)}")
    
    # 1. Obtener los IDs de los sets desde la base de datos
    sets_resp = supabase.table('sets').select('set_id,set_code').in_('set_code', TARGET_SETS).eq('game_id', GAME_ID).execute()
    db_sets = sets_resp.data
    
    if not db_sets:
        print("❌ No se encontraron los sets en la tabla 'sets'.")
        return

    print(f"✅ Encontrados {len(db_sets)} sets en la base de datos.")

    for s in db_sets:
        set_id = s['set_id']
        set_code = s['set_code']
        print(f"\n📦 Procesando {set_code} (ID: {set_id})...")
        
        # 2. Consultar Scryfall
        url = f"https://api.scryfall.com/cards/search?q=e%3A{set_code}&unique=prints"
        all_cards = []
        
        while url:
            resp = requests.get(url)
            if resp.status_code == 404:
                print(f"  ⚠️ Set {set_code} no encontrado o vacío en Scryfall.")
                break
            resp.raise_for_status()
            data = resp.json()
            all_cards.extend(data.get('data', []))
            url = data.get('next_page')
            if url: time.sleep(0.1)

        if not all_cards:
            continue

        print(f"  ✨ {len(all_cards)} cartas encontradas en Scryfall.")

        # 3. Mapear e insertar
        cards_dict = {}
        printings_dict = {}
        
        for card in all_cards:
            if card.get('lang') != 'en' or 'oracle_id' not in card:
                continue
            
            oracle_id = card['oracle_id']
            if oracle_id not in cards_dict:
                cards_dict[oracle_id] = {
                    'card_id': oracle_id,
                    'game_id': GAME_ID,
                    'card_name': card['name'],
                    'type_line': card.get('type_line'),
                    'oracle_text': card.get('oracle_text'),
                    'mana_cost': card.get('mana_cost'),
                    'rarity': card.get('rarity'),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            
            # Imagen
            image_url = card.get('image_uris', {}).get('normal')
            if not image_url and 'card_faces' in card:
                image_url = card['card_faces'][0].get('image_uris', {}).get('normal')

            printing_id = card['id']
            printings_dict[printing_id] = {
                'printing_id': printing_id,
                'scryfall_id': printing_id,
                'card_id': oracle_id,
                'set_id': set_id,
                'set_code': card.get('set'),
                'collector_number': card.get('collector_number'),
                'image_url': image_url,
                'prices': card.get('prices'),
                'card_faces': card.get('card_faces'),
                'rarity': card.get('rarity'),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }

        # Upsert en bloques de 100
        cards_to_upsert = list(cards_dict.values())
        printings_to_upsert = list(printings_dict.values())
        
        for i in range(0, len(cards_to_upsert), 100):
            supabase.table('cards').upsert(cards_to_upsert[i:i+100], on_conflict='card_id').execute()
        for i in range(0, len(printings_to_upsert), 100):
            supabase.table('card_printings').upsert(printings_to_upsert[i:i+100], on_conflict='printing_id').execute()
            
        print(f"  ✅ {set_code} finalizado.")

    print("\n🎉 Sincronización completada.")

if __name__ == "__main__":
    main()
