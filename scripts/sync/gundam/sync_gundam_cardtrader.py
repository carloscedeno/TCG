# -*- coding: utf-8 -*-
"""
sync_gundam_cardtrader.py
Sincroniza TODAS las cartas de Gundam en nuestra BD con los blueprints
de CardTrader, guardando el link oficial y preparando el campo de precio.

Proceso:
1. Descarga todas las expansiones de Gundam desde CardTrader.
2. Para cada expansion, descarga sus blueprints via /api/v2/blueprints?game_id=23&expansion_id=X
3. Busca la expansion equivalente en nuestra BD usando el set_code.
4. Cruza los blueprints con nuestras card_printings por nombre + set_code.
5. Guarda el link oficial (https://www.cardtrader.com/cards/{slug}) en related_uris.cardtrader
"""
import os
import time
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
SUPABASE_URL = os.environ.get('DEV_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('DEV_SUPABASE_SERVICE_ROLE_KEY')
CT_TOKEN = os.environ.get('CARDTRADER_API_KEY')
CT_HEADERS = {'Authorization': f'Bearer {CT_TOKEN}'}
CT_GAME_ID = 23

def main():
    print("Iniciando sincronizacion Gundam <-> CardTrader...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Descargar todas las expansiones de Gundam desde CardTrader
    print("Descargando expansiones de Gundam desde CardTrader...")
    exp_resp = requests.get('https://api.cardtrader.com/api/v2/expansions', headers=CT_HEADERS)
    ct_expansions = [e for e in exp_resp.json() if e.get('game_id') == CT_GAME_ID]
    print(f"  -> {len(ct_expansions)} expansiones encontradas en CardTrader.")

    # 2. Descargar TODOS los blueprints de Gundam de una vez
    print("Descargando blueprints de todas las expansiones...")
    all_blueprints = []
    for exp in ct_expansions:
        bp_resp = requests.get(
            f'https://api.cardtrader.com/api/v2/blueprints?game_id={CT_GAME_ID}&expansion_id={exp["id"]}',
            headers=CT_HEADERS
        )
        if bp_resp.status_code == 200:
            bps = bp_resp.json()
            if isinstance(bps, list):
                for bp in bps:
                    bp['expansion_code'] = exp.get('code', '').lower()
                all_blueprints.extend(bps)
        time.sleep(0.15)  # rate limit

    print(f"  -> {len(all_blueprints)} blueprints descargados en total.")

    # Construimos un lookup: (name_lower, expansion_code) -> blueprint
    bp_by_name_and_set = {}
    bp_by_name_only = {}
    for bp in all_blueprints:
        name = bp.get('name', '').lower().strip()
        exp_code = bp.get('expansion_code', '').lower()
        bp_by_name_and_set[(name, exp_code)] = bp
        if name not in bp_by_name_only:
            bp_by_name_only[name] = bp  # fallback: primer match por nombre

    # 3. Bajar todas las card_printings de Gundam desde nuestra BD
    print("Descargando card_printings de Gundam desde Supabase...")
    # Gundam tiene game_id=17 en nuestra BD; las printings tienen set_code y card_id
    # Unimos con cards para obtener card_name
    all_printings = []
    page = 0
    page_size = 500
    while True:
        res = (supabase.table('card_printings')
               .select('printing_id, card_id, set_code, related_uris, cards(card_name, game_id)')
               .range(page * page_size, (page + 1) * page_size - 1)
               .execute())
        batch = [p for p in res.data if p.get('cards') and p['cards'].get('game_id') == 17]
        all_printings.extend(batch)
        if len(res.data) < page_size:
            break
        page += 1

    print(f"  -> {len(all_printings)} printings de Gundam en nuestra BD.")

    # 4. Cruzar y actualizar
    match_count = 0
    no_match = 0
    already_done = 0

    for printing in all_printings:
        card_name = printing['cards']['card_name'].lower().strip()
        set_code = (printing.get('set_code') or '').lower()
        
        current_uris = printing.get('related_uris') or {}

        # Match primario: nombre + set_code
        bp = bp_by_name_and_set.get((card_name, set_code))
        
        # Fallback: solo nombre
        if not bp:
            bp = bp_by_name_only.get(card_name)
        
        if bp:
            real_url = f"https://www.cardtrader.com/cards/{bp['slug']}"
            current_uris['cardtrader'] = real_url
            
            supabase.table('card_printings').update({
                'related_uris': current_uris
            }).eq('printing_id', printing['printing_id']).execute()
            
            match_count += 1
            print(f"OK  {printing['cards']['card_name']} -> {real_url}")
        else:
            no_match += 1

    print(f"\n=== RESUMEN ===")
    print(f"  Actualizados con link real: {match_count}")
    print(f"  Sin match en CardTrader:    {no_match}")
    print(f"\nListo! El frontend ahora usara los links directos de CardTrader.")

if __name__ == '__main__':
    main()
