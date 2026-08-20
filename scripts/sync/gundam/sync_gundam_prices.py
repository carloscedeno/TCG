# -*- coding: utf-8 -*-
"""
sync_gundam_prices.py
Para cada carta de Gundam que ya tiene un link de CardTrader en related_uris,
extrae el blueprint_id del link y consulta el endpoint de marketplace de CT
para obtener el precio de mercado real (mediana de listings Near Mint).

Guarda el resultado en avg_market_price_usd de card_printings.
"""
import os
import re
import time
import statistics
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
SUPABASE_URL = os.environ.get('DEV_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('DEV_SUPABASE_SERVICE_ROLE_KEY')
CT_TOKEN = os.environ.get('CARDTRADER_API_KEY')
CT_HEADERS = {'Authorization': f'Bearer {CT_TOKEN}'}

def get_blueprint_id_from_url(url: str) -> str | None:
    """Extrae el blueprint_id del link de CardTrader. Ej: /cards/341373-demi-trainer -> 341373"""
    m = re.search(r'/cards/(\d+)-', url)
    return m.group(1) if m else None

def get_ct_market_price(blueprint_id: str) -> float | None:
    """Consulta el marketplace de CT y retorna la mediana de precios NM en USD."""
    try:
        r = requests.get(
            f'https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id={blueprint_id}',
            headers=CT_HEADERS,
            timeout=10
        )
        if r.status_code != 200:
            return None

        products = r.json().get(str(blueprint_id), [])
        
        # Filtramos: Near Mint, no graded, no on_vacation, USD
        nm_prices = [
            p['price_cents'] / 100.0
            for p in products
            if (p.get('properties_hash', {}).get('condition') == 'Near Mint'
                and not p.get('graded')
                and not p.get('on_vacation')
                and p.get('price_currency') == 'USD')
        ]
        
        if not nm_prices:
            return None
            
        # CT Market Price = mediana (igual que CardTrader lo calcula)
        return round(statistics.median(sorted(nm_prices)), 2)
        
    except Exception as e:
        print(f'Error al consultar CT para blueprint {blueprint_id}: {e}')
        return None

def main():
    print("Iniciando sync de precios reales de CardTrader para Gundam...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Traemos todas las card_printings de Gundam que ya tienen link de CT en related_uris
    print("Descargando printings con link de CardTrader desde Supabase...")
    all_printings = []
    page = 0
    page_size = 500
    while True:
        res = (supabase.table('card_printings')
               .select('printing_id, related_uris, avg_market_price_usd, cards(card_name, game_id)')
               .range(page * page_size, (page + 1) * page_size - 1)
               .execute())
        batch = [
            p for p in res.data
            if p.get('cards') and p['cards'].get('game_id') == 17
            and p.get('related_uris') and p['related_uris'].get('cardtrader')
        ]
        all_printings.extend(batch)
        if len(res.data) < page_size:
            break
        page += 1

    print(f"  -> {len(all_printings)} printings de Gundam con link de CT para actualizar.")

    # Agrupamos por blueprint_id para no llamar a la API mas de una vez por carta
    blueprint_price_cache: dict[str, float | None] = {}
    updated = 0
    no_price = 0

    for i, printing in enumerate(all_printings):
        ct_url = printing['related_uris']['cardtrader']
        blueprint_id = get_blueprint_id_from_url(ct_url)
        
        if not blueprint_id:
            no_price += 1
            continue
        
        # Usamos cache para no llamar a la API multiples veces para el mismo blueprint
        if blueprint_id not in blueprint_price_cache:
            blueprint_price_cache[blueprint_id] = get_ct_market_price(blueprint_id)
            time.sleep(0.2)  # rate limit conservador
        
        market_price = blueprint_price_cache[blueprint_id]
        
        if market_price is not None:
            supabase.table('card_printings').update({
                'avg_market_price_usd': market_price
            }).eq('printing_id', printing['printing_id']).execute()
            
            card_name = printing['cards']['card_name']
            print(f"[{i+1}/{len(all_printings)}] {card_name}: ${market_price}")
            updated += 1
        else:
            no_price += 1

    print(f"\n=== RESUMEN ===")
    print(f"  Actualizados con precio real de CT:  {updated}")
    print(f"  Sin precio disponible en CT:          {no_price}")
    print(f"  Blueprints unicos consultados:        {len(blueprint_price_cache)}")
    print(f"\nListo! Los precios de mercado de Gundam ahora vienen de CardTrader.")

if __name__ == '__main__':
    main()
