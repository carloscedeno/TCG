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
import requests
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import random
from requests.exceptions import RequestException, HTTPError, ConnectionError, Timeout
from urllib3.exceptions import MaxRetryError, ProtocolError

# Cargar variables de entorno
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
GAME_ID = 22  # MTG

assert SUPABASE_URL and SUPABASE_KEY, "Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu entorno/.env"

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
        'frame_effects': card.get('frame_effects'),
        'promo_types': card.get('promo_types'),
        'full_art': card.get('full_art', False),
        'textless': card.get('textless', False),
        'oversized': card.get('oversized', False),
        'variation': card.get('variation', False),
        'finishes': card.get('finishes'),
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
        # Usar retry_request para manejar errores de conexión
        resp = retry_request(requests.get, url, headers=headers)
        
        if resp.status_code == 404:
            return None  # Set no encontrado en Scryfall
        
        resp.raise_for_status()
        data = resp.json()
        cards.extend(data['data'])
        url = data.get('next_page')
        time.sleep(0.1)  # Para evitar rate limit
    
    return cards

def main():
    print("🚀 Iniciando carga de cartas de MTG desde Scryfall...")
    print(f"📋 Configuración de reintentos: máximo {MAX_RETRIES} intentos, delay base {BASE_DELAY}s")
    
    print("Obteniendo sets de MTG desde la base de datos...")
    sets_resp = retry_supabase_operation(
        supabase.table('sets').select('set_id,set_code').eq('game_id', GAME_ID).execute
    )
    sets = sets_resp.data
    print(f"Sets de MTG encontrados: {len(sets)}")

    total_cards, total_printings, skipped_sets, error_sets = 0, 0, 0, 0
    
    for i, s in enumerate(sets, 1):
        set_id = s['set_id']
        set_code = s['set_code']
        print(f"\n📦 [{i}/{len(sets)}] Procesando set {set_code} (ID {set_id})...")
        
        try:
            cards = get_all_cards_for_set(set_code)
            if cards is None:
                print(f"  ⚠️  Set {set_code} no tiene cartas en Scryfall o no existe. Saltando...")
                skipped_sets += 1
                continue
            
            print(f"  📄 Cartas encontradas: {len(cards)}")
            set_cards, set_printings = 0, 0
            
            for j, card in enumerate(cards, 1):
                try:
                    if 'oracle_id' not in card:
                        # Importar tokens y emblemas
                        layout = card.get('layout')
                        if layout in ('token', 'emblem'):
                            printing_data = map_scryfall_printing(card, set_id)
                            printing_data['card_id'] = None
                            printing_data['is_token'] = layout == 'token'
                            printing_data['is_emblem'] = layout == 'emblem'
                            printing_id = printing_data['printing_id']
                            
                            existing_printing = retry_supabase_operation(
                                supabase.table('card_printings').select('printing_id').eq('printing_id', printing_id).execute
                            )
                            
                            if existing_printing.data and len(existing_printing.data) > 0:
                                retry_supabase_operation(
                                    supabase.table('card_printings').update(printing_data).eq('printing_id', printing_id).execute
                                )
                            else:
                                retry_supabase_operation(
                                    supabase.table('card_printings').insert(printing_data).execute
                                )
                            
                            set_printings += 1
                            if j % 50 == 0:  # Log cada 50 cartas para no saturar la salida
                                print(f"  ➕ Token/Emblema importado: {card.get('name')} ({layout})")
                        else:
                            print(f"  ⚠️  Carta sin oracle_id (probablemente token o emblema desconocido), saltando: {card.get('name')}")
                        continue
                    
                    # Insertar/actualizar card
                    card_data = map_scryfall_card(card)
                    card_id = card_data['card_id']
                    
                    existing_card = retry_supabase_operation(
                        supabase.table('cards').select('card_id').eq('card_id', card_id).execute
                    )
                    
                    if existing_card.data and len(existing_card.data) > 0:
                        retry_supabase_operation(
                            supabase.table('cards').update(card_data).eq('card_id', card_id).execute
                        )
                    else:
                        retry_supabase_operation(
                            supabase.table('cards').upsert(card_data, on_conflict='game_id,card_name').execute
                        )
                    
                    set_cards += 1
                    
                    # Insertar/actualizar printing
                    printing_data = map_scryfall_printing(card, set_id)
                    printing_id = printing_data['printing_id']
                    
                    existing_printing = retry_supabase_operation(
                        supabase.table('card_printings').select('printing_id').eq('printing_id', printing_id).execute
                    )
                    
                    if existing_printing.data and len(existing_printing.data) > 0:
                        retry_supabase_operation(
                            supabase.table('card_printings').update(printing_data).eq('printing_id', printing_id).execute
                        )
                    else:
                        retry_supabase_operation(
                            supabase.table('card_printings').insert(printing_data).execute
                        )
                    
                    set_printings += 1
                    
                    # Log de progreso cada 100 cartas
                    if j % 100 == 0:
                        print(f"  📊 Progreso: {j}/{len(cards)} cartas procesadas")
                
                except Exception as e:
                    print(f"  ❌ Error procesando carta {card.get('name', 'desconocida')}: {str(e)}")
                    continue  # Continuar con la siguiente carta
            
            total_cards += set_cards
            total_printings += set_printings
            print(f"  ✅ Set {set_code} completado: {set_cards} cartas, {set_printings} impresiones")
            
        except Exception as e:
            print(f"  ❌ Error procesando set {set_code}: {str(e)}")
            error_sets += 1
            continue  # Continuar con el siguiente set
    
    print(f"\n🎉 ¡Carga de cartas de MTG completada!")
    print(f"📊 Resumen:")
    print(f"  • Cartas procesadas: {total_cards}")
    print(f"  • Impresiones procesadas: {total_printings}")
    print(f"  • Sets omitidos: {skipped_sets}")
    print(f"  • Sets con errores: {error_sets}")
    print(f"  • Sets procesados exitosamente: {len(sets) - skipped_sets - error_sets}")

if __name__ == "__main__":
    main() 