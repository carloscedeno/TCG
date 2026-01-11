#!/usr/bin/env python3
"""
Carga todos los sets de Magic: The Gathering desde Scryfall y los inserta en la tabla 'sets' de Supabase.
Optimizado para procesamiento por lotes (batch).
"""
import os
import requests
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
GAME_ID = 22  # MTG

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu entorno/.env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SCRYFALL_SETS_URL = "https://api.scryfall.com/sets"

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

def main():
    print("🚀 Iniciando sincronización de sets desde Scryfall...")
    resp = requests.get(SCRYFALL_SETS_URL)
    resp.raise_for_status()
    all_sets = resp.json()['data']
    print(f"Total de sets encontrados en Scryfall: {len(all_sets)}")

    # Filtrar solo sets principales (sin parent_set_code)
    mtg_sets = [s for s in all_sets if s.get('parent_set_code') is None]
    print(f"Sets de MTG a procesar: {len(mtg_sets)}")

    # Mapear datos
    mapped_sets = [map_scryfall_set(s) for s in mtg_sets]

    # 1. Obtener sets existentes en la DB para comparar
    print("📋 Obteniendo sets actuales de la base de datos...")
    existing_sets_resp = supabase.table('sets').select('set_code').eq('game_id', GAME_ID).execute()
    existing_codes = {s['set_code'] for s in existing_sets_resp.data}
    print(f"Sets actuales en la DB: {len(existing_codes)}")

    to_insert = []
    to_update = []

    for mapped in mapped_sets:
        if mapped['set_code'] in existing_codes:
            to_update.append(mapped)
        else:
            to_insert.append(mapped)

    print(f"➕ Sets nuevos a insertar: {len(to_insert)}")
    print(f"🔄 Sets existentes a actualizar: {len(to_update)}")

    # Insertar en lotes
    if to_insert:
        batch_size = 100
        for i in range(0, len(to_insert), batch_size):
            batch = to_insert[i:i + batch_size]
            supabase.table('sets').insert(batch).execute()
            print(f"  ✅ Insertado lote {i//batch_size + 1}/{(len(to_insert)-1)//batch_size + 1}")

    # Actualizar individualmente (o en lotes si tuviéramos un ID, pero por ahora individualmente es más seguro)
    if to_update:
        print("🛠️ Actualizando sets existentes...")
        for s in to_update:
            # Para mayor velocidad en el log, no imprimimos cada uno
            supabase.table('sets').update(s).eq('set_code', s['set_code']).eq('game_id', GAME_ID).execute()
    
    print(f"✨ Sincronización completada.")
    
    # Verificar específicamente si ECL está presente
    if 'ecl' in [s['set_code'] for s in mapped_sets]:
        print(f"🔍 Confirmado: Set 'Lorwyn Eclipsed' (ECL) encontrado.")
    else:
        print(f"⚠️ Alerta: Set 'ECL' no encontrado en Scryfall.")

if __name__ == "__main__":
    main()