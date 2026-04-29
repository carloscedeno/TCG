#!/usr/bin/env python3
"""
Carga todas las cartas de Magic: The Gathering desde Scryfall para cada set en la tabla 'sets' (game_id=22),
y las inserta en las tablas 'cards' y 'card_printings' de Supabase.

- Usa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY desde .env o variables de entorno.
- Es idempotente y seguro para re-ejecutar.
- Incluye reintentos automáticos con backoff exponencial para errores de conexión.
- Imprime un resumen de la operación.
- Pobla todos los campos relevantes de Scryfall (arrays, jsonb, fechas, layouts, etc).

Uso:
    python data_loader/load_mtgs_cards_from_scryfall.py
"""
import os
import sys
import io

# Forzar UTF-8 en la salida de consola para evitar errores en Windows con emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import random
from requests.exceptions import RequestException, HTTPError, ConnectionError, Timeout
from urllib3.exceptions import MaxRetryError, ProtocolError

# Cargar variables de entorno
# Intentar cargar desde el directorio raíz si el script se ejecuta desde folders internos
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv() # También intentar local

SUPABASE_URL = (os.getenv('SUPABASE_URL') or "").strip()
# Normalización de URL para soportar solo el ID del proyecto (ej: sxuotvogwv...)
if SUPABASE_URL and not SUPABASE_URL.startswith('http'):
    SUPABASE_URL = f"https://{SUPABASE_URL}.supabase.co"

# Intentar service_role por seguridad, pero fallback a anon si no existe
SUPABASE_KEY = (os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY') or "").strip()
GAME_ID = 22  # MTG

if not SUPABASE_URL or not SUPABASE_KEY:
    print(f"❌ Error: SUPABASE_URL o SUPABASE_KEY no encontrados.")
    print(f"DEBUG: URL={SUPABASE_URL}, KEY={'Found' if SUPABASE_KEY else 'Missing'}")
    sys.exit(1)

print(f"🔗 Conectando a Supabase: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SCRYFALL_CARDS_URL = "https://api.scryfall.com/cards/search?q=e%3A{set_code}&unique=prints"

# Configuración de reintentos
MAX_RETRIES = 5
BASE_DELAY = 1  # segundos
MAX_DELAY = 60  # segundos

def exponential_backoff(attempt, base_delay=BASE_DELAY, max_delay=MAX_DELAY):
    """Calcula el delay para reintentos con backoff exponencial."""
    delay = min(base_delay * (2 ** attempt) + random.uniform(0, 1), max_delay)
    return delay

def retry_request(func, *args, **kwargs):
    """Ejecuta una función con reintentos automáticos para errores de conexión."""
    last_exception = None
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            result = func(*args, **kwargs)
            if result is not None:  # Asegurar que no retornamos None
                return result
            else:
                raise ValueError("La función retornó None")
        except (ConnectionError, Timeout, ProtocolError, MaxRetryError) as e:
            last_exception = e
            if attempt < MAX_RETRIES:
                delay = exponential_backoff(attempt)
                print(f"  🔄 Error de conexión (intento {attempt + 1}/{MAX_RETRIES + 1}): {str(e)}")
                print(f"  ⏳ Reintentando en {delay:.1f} segundos...")
                time.sleep(delay)
            else:
                print(f"  ❌ Error de conexión después de {MAX_RETRIES + 1} intentos: {str(e)}")
                raise
        except HTTPError as e:
            if e.response and e.response.status_code == 404:
                # 404 no es un error de conexión, no reintentar
                raise
            elif e.response and e.response.status_code >= 500:
                # Errores del servidor (5xx) se reintentan
                last_exception = e
                if attempt < MAX_RETRIES:
                    delay = exponential_backoff(attempt)
                    print(f"  🔄 Error del servidor {e.response.status_code} (intento {attempt + 1}/{MAX_RETRIES + 1})")
                    print(f"  ⏳ Reintentando en {delay:.1f} segundos...")
                    time.sleep(delay)
                else:
                    print(f"  ❌ Error del servidor después de {MAX_RETRIES + 1} intentos: {str(e)}")
                    raise
            else:
                # Otros errores HTTP no se reintentan
                raise
        except RequestException as e:
            last_exception = e
            if attempt < MAX_RETRIES:
                delay = exponential_backoff(attempt)
                print(f"  🔄 Error de request (intento {attempt + 1}/{MAX_RETRIES + 1}): {str(e)}")
                print(f"  ⏳ Reintentando en {delay:.1f} segundos...")
                time.sleep(delay)
            else:
                print(f"  ❌ Error de request después de {MAX_RETRIES + 1} intentos: {str(e)}")
                raise
    
    # Si llegamos aquí, algo salió mal
    if last_exception:
        raise last_exception
    raise RuntimeError("Función falló después de todos los reintentos")

def retry_supabase_operation(operation_func, *args, **kwargs):
    """Ejecuta una operación de Supabase con reintentos automáticos."""
    last_exception = None
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            result = operation_func(*args, **kwargs)
            if result is not None:  # Asegurar que no retornamos None
                return result
            else:
                raise ValueError("La operación de Supabase retornó None")
        except Exception as e:
            last_exception = e
            error_str = str(e).lower()
            
            # Reintentar solo para errores de conexión o temporales
            if any(keyword in error_str for keyword in ['connection', 'timeout', 'network', 'temporary', 'rate limit']):
                if attempt < MAX_RETRIES:
                    delay = exponential_backoff(attempt)
                    print(f"  🔄 Error de Supabase (intento {attempt + 1}/{MAX_RETRIES + 1}): {str(e)}")
                    print(f"  ⏳ Reintentando en {delay:.1f} segundos...")
                    time.sleep(delay)
                else:
                    print(f"  ❌ Error de Supabase después de {MAX_RETRIES + 1} intentos: {str(e)}")
                    raise
            else:
                # Otros errores no se reintentan
                raise
    
    if last_exception:
        raise last_exception
    raise RuntimeError("Operación de Supabase falló después de todos los reintentos")

# Mapeo de campos Scryfall -> DB para 'cards'
def map_scryfall_card(card):
    # Para cartas de doble cara, el oracle_text y type_line pueden estar en las caras
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

# Mapeo de campos Scryfall -> DB para 'card_printings'
def map_scryfall_printing(card, set_id):
    # Imagen: si no está en el nivel superior, está en la primera cara
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

def get_all_cards_for_set(set_code):
    """Descarga todas las cartas de un set de Scryfall (maneja paginación). Si el set no existe (404), retorna None."""
    cards = []
    url = SCRYFALL_CARDS_URL.format(set_code=set_code)
    headers = {
        'User-Agent': 'TCGWebApp/1.0 (contact: tu-email@ejemplo.com)',
        'Accept': 'application/json'
    }
    
    while url:
        print(f"  🔍 Consultando Scryfall: {url}")
        # Usar retry_request para manejar errores de conexión
        resp = retry_request(requests.get, url, headers=headers)
        
        if resp.status_code == 404:
            print(f"  ❌ Error 404: Scryfall no encontró el set {set_code}")
            return None
        
        resp.raise_for_status()
        data = resp.json()
        found = len(data.get('data', []))
        print(f"  📄 Página recibida: {found} cartas encontradas.")
        cards.extend(data['data'])
        url = data.get('next_page')
        if url:
            print("  ⏳ Esperando para la siguiente página...")
            time.sleep(0.1)
    
    return cards

def main():
    # Soporte para argumentos: --full para todo, o un número para límite de test
    args = sys.argv[1:]
    is_full_sync = '--full' in args
    limit = None
    for arg in args:
        if arg.isdigit():
            limit = int(arg)
            break
    
    print(f"🚀 Iniciando carga de cartas de MTG desde Scryfall...")
    if is_full_sync:
        print("📁 Modo: FULL SYNC (Procesando todos los sets)")
    else:
        print("⏱️ Modo: RECENT ONLY (Sets de los últimos 90 días)")
        
    print(f"📋 Configuración de reintentos: máximo {MAX_RETRIES} intentos, delay base {BASE_DELAY}s")
    
    print("Obteniendo sets de MTG desde la base de datos...")
    
    query = supabase.table('sets').select('set_id,set_code,release_date').eq('game_id', GAME_ID)
    
    if not is_full_sync:
        # Solo sets lanzados en los últimos 90 días (captura nuevos lanzamientos y spoilers)
        from datetime import timedelta
        threshold_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
        query = query.gte('release_date', threshold_date)
    
    sets_resp = retry_supabase_operation(query.execute)
    sets = sets_resp.data
    
    # Ordenar por fecha de lanzamiento desc (lo más nuevo primero)
    sets.sort(key=lambda x: x.get('release_date') or '', reverse=True)
    
    if limit:
        print(f"🧪 Aplicando límite de test: {limit} sets")
        sets = sets[:limit]
        
    print(f"Sets de MTG a procesar: {len(sets)}")

    total_cards, total_printings, skipped_sets, error_sets = 0, 0, 0, 0
    
    for i, s in enumerate(sets, 1):
        set_id = s['set_id']
        set_code = s['set_code']
        rel_date = s.get('release_date', 'unknown')
        print(f"\n📦 [{i}/{len(sets)}] Procesando set {set_code} (Lanzado: {rel_date})...")
        
        try:
            cards = get_all_cards_for_set(set_code)
            if cards is None:
                print(f"  ⚠️  Set {set_code} no tiene cartas en Scryfall o no existe. Saltando...")
                skipped_sets += 1
                continue
            
            # Aplicar límite de cartas por set si estamos en modo test
            if limit:
                cards = cards[:limit]
                
            print(f"  📄 Cartas encontradas: {len(cards)}")
            set_cards, set_printings = 0, 0
            
            cards_dict = {}
            printings_dict = {}
            BATCH_SIZE = 500
            
            for j, card in enumerate(cards, 1):
                try:
                    if 'oracle_id' not in card:
                        continue
                    
                    # Filtro obligatorio: Solo inglés por ahora
                    if card.get('lang') != 'en':
                        continue
                        
                    # Preparar card (deduplicar por card_id)
                    c_data = map_scryfall_card(card)
                    cards_dict[c_data['card_id']] = c_data
                    
                    # Preparar printing (deduplicar por printing_id)
                    p_data = map_scryfall_printing(card, set_id)
                    printings_dict[p_data['printing_id']] = p_data
                    
                    # Si el lote está lleno, procesar
                    if len(cards_dict) >= BATCH_SIZE:
                        retry_supabase_operation(supabase.table('cards').upsert(list(cards_dict.values()), on_conflict='card_id').execute)
                        retry_supabase_operation(supabase.table('card_printings').upsert(list(printings_dict.values()), on_conflict='printing_id').execute)
                        set_cards += len(cards_dict)
                        set_printings += len(printings_dict)
                        print(f"  ✨ [{j}/{len(cards)}] Lote procesado.")
                        cards_dict = {}
                        printings_dict = {}
                        sys.stdout.flush()
                
                except Exception as e:
                    print(f"  ❌ Error preparando carta {card.get('name', 'desconocida')}: {str(e)}")
                    continue
            
            # Procesar el resto del lote si queda algo
            if cards_dict:
                retry_supabase_operation(supabase.table('cards').upsert(list(cards_dict.values()), on_conflict='card_id').execute)
                retry_supabase_operation(supabase.table('card_printings').upsert(list(printings_dict.values()), on_conflict='printing_id').execute)
                set_cards += len(cards_dict)
                set_printings += len(printings_dict)
                print(f"  ✨ Final del lote procesado ({len(cards_dict)} ítems).")
            
            total_cards += set_cards
            total_printings += set_printings
            print(f"  ✅ Set {set_code} completado: {set_cards} cartas, {set_printings} impresiones")
            print(f"  📈 Acumulado total: {total_cards} cartas, {total_printings} impresiones")
            
        except Exception as e:
            print(f"  ❌ Error procesando set {set_code}: {str(e)}")
            error_sets += 1
            continue
    
    print(f"\n🎉 ¡Carga de cartas de MTG completada!")
    print(f"📊 Resumen: {total_cards} cartas, {total_printings} impresiones.")

if __name__ == "__main__":
    main()