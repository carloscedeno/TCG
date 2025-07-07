#!/usr/bin/env python3
"""
Carga todos los sets de Magic: The Gathering desde Scryfall y los inserta en la tabla 'sets' de Supabase.
"""
import os
import requests
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GAME_CODE = 'MTG'
GAME_ID = 22  # Ajusta si tu tabla de juegos tiene otro ID para MTG

assert SUPABASE_URL and SUPABASE_KEY, "Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu entorno/.env"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SCRYFALL_SETS_URL = "https://api.scryfall.com/sets"

# Mapeo de campos Scryfall -> DB
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
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
    }

def main():
    print("Descargando sets de Scryfall...")
    resp = requests.get(SCRYFALL_SETS_URL)
    resp.raise_for_status()
    sets = resp.json()['data']
    print(f"Total de sets encontrados en Scryfall: {len(sets)}")

    # Filtrar solo sets principales (sin parent_set_code)
    mtg_sets = [s for s in sets if s.get('parent_set_code') is None]
    print(f"Sets de MTG a procesar: {len(mtg_sets)}")

    inserted, updated, skipped = 0, 0, 0
    for s in mtg_sets:
        mapped = map_scryfall_set(s)
        set_code = mapped['set_code']
        # Verificar si ya existe
        existing = supabase.table('sets').select('set_id').eq('set_code', set_code).eq('game_id', GAME_ID).execute()
        if existing.data and len(existing.data) > 0:
            # Actualizar si hay cambios
            supabase.table('sets').update(mapped).eq('set_code', set_code).eq('game_id', GAME_ID).execute()
            updated += 1
        else:
            supabase.table('sets').insert(mapped).execute()
            inserted += 1
    print(f"Sets insertados: {inserted}, actualizados: {updated}, omitidos: {skipped}")
    print("¡Carga de sets de MTG completada!")

if __name__ == "__main__":
    main() 