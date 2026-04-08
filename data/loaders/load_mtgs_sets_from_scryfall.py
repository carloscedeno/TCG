#!/usr/bin/env python3
"""
Carga todos los sets de Magic: The Gathering desde Scryfall y los inserta en la tabla 'sets' de Supabase.
Optimizado para procesamiento por lotes (batch) con upsert para evitar 502s por requests individuales.
"""
import os
import time
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


def upsert_batch(batch: list, batch_num: int, total_batches: int, max_retries: int = 3):
    """Upsert a batch with exponential backoff retry on transient errors (502, etc.)."""
    for attempt in range(max_retries):
        try:
            supabase.table('sets').upsert(
                batch,
                on_conflict='set_code,game_id'
            ).execute()
            print(f"  ✅ Lote {batch_num}/{total_batches} ({len(batch)} sets)")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # 1s, 2s, 4s
                print(f"  ⚠️ Lote {batch_num} falló (intento {attempt + 1}), reintentando en {wait}s... [{e}]")
                time.sleep(wait)
            else:
                print(f"  ❌ Lote {batch_num} falló definitivamente tras {max_retries} intentos.")
                raise


def main():
    print("🚀 Iniciando sincronización de sets desde Scryfall...")
    resp = requests.get(SCRYFALL_SETS_URL)
    resp.raise_for_status()
    all_sets = resp.json()['data']
    print(f"Total de sets encontrados en Scryfall: {len(all_sets)}")

    # Filtrar sets que no son cartas jugables (tokens, memorabilia)
    excluded_types = ['token', 'memorabilia']
    mtg_sets = [s for s in all_sets if s.get('set_type') not in excluded_types]
    print(f"Sets de MTG a procesar (excluyendo {excluded_types}): {len(mtg_sets)}")

    # Mapear datos
    mapped_sets = [map_scryfall_set(s) for s in mtg_sets]

    # Upsert en lotes (INSERT + UPDATE via on_conflict)
    # La estrategia anterior hacía 727 requests individuales que saturaban la API y provocaban 502s.
    # Ahora agrupamos en lotes de 100 + retry con backoff exponencial.
    batch_size = 100
    total_batches = (len(mapped_sets) - 1) // batch_size + 1
    print(f"📦 Haciendo upsert de {len(mapped_sets)} sets en {total_batches} lotes de {batch_size}...")

    for i in range(0, len(mapped_sets), batch_size):
        batch = mapped_sets[i:i + batch_size]
        batch_num = i // batch_size + 1
        upsert_batch(batch, batch_num, total_batches)

    print("✨ Sincronización completada.")

    # Verificar específicamente si ECL está presente
    if 'ecl' in [s['set_code'] for s in mapped_sets]:
        print("🔍 Confirmado: Set 'Lorwyn Eclipsed' (ECL) encontrado.")
    else:
        print("⚠️ Alerta: Set 'ECL' no encontrado en Scryfall.")


if __name__ == "__main__":
    main()