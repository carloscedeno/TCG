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
import sys
import time
import requests
from dotenv import load_dotenv
from supabase import create_client

# Evitar errores de codificacion en Windows al imprimir cartas con caracteres raros
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv('.env')
SUPABASE_URL = os.environ.get('DEV_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('DEV_SUPABASE_SERVICE_ROLE_KEY')
CT_TOKEN = os.environ.get('CARDTRADER_API_KEY')
CT_HEADERS = {'Authorization': f'Bearer {CT_TOKEN}'}
CT_GAME_ID = 23

def find_cardtrader_match(printing, all_blueprints, bp_by_name_and_set):
    """
    Applies the 4 Mapping Rules (CGS -> CardTrader)
    """
    card_name = printing['cards']['card_name'].lower().strip()
    set_code = (printing.get('set_code') or '').lower()
    cn_raw = printing.get('collector_number') or ''
    cn = cn_raw.lower().replace('_', '-').strip()
    
    bp = None

    # Regla 1: Normalizacion (Base Collector Number)
    if cn:
        base_cn = cn.split('-pr')[0]
        
        # Regla 2: Búsqueda profunda (Meta Matching)
        candidates = []
        for b in all_blueprints:
            meta = b.get('meta_name', '').lower()
            slug = b.get('slug', '').lower()
            if base_cn in meta or base_cn in slug:
                # Regla 3: Filtro de Seguridad (Name Colission)
                if card_name in b.get('name', '').lower().strip():
                    candidates.append(b)
        
        # Regla 4: Triangulación de Versiones y Rarezas
        if candidates:
            # Orden base: preferir None o Foil, mandar LR+/Parallel al final
            def version_score(b):
                v = (b.get('version') or '').lower()
                if not v: return 0
                if 'foil' in v: return 1
                return 10
            
            candidates.sort(key=version_score)
            
            # Preferimos el que coincida con el set_code base (match perfecto)
            perfect = [b for b in candidates if b.get('expansion_code') == set_code]
            if perfect:
                bp = perfect[0]
            else:
                # Validamos si es carta base o promo para ajustar pesos
                is_promo = 'pr' in cn
                if not is_promo:
                    valid_base_candidates = [
                        b for b in candidates 
                        if b.get('expansion_code') in [set_code, set_code+'-b', 'g-rep']
                    ]
                    if valid_base_candidates:
                        bp = valid_base_candidates[0]
                else:
                    def promo_score(b):
                        v = (b.get('version') or '').lower()
                        # Preferimos promos (Parallel, LR+, o sets promocionales)
                        if 'lr+' in v or 'parallel' in v or b.get('expansion_code') not in [set_code, set_code+'-b', 'g-rep']:
                            return -1 
                        return 0
                    candidates.sort(key=promo_score)
                    bp = candidates[0]

    # Fallback (Plan de Contingencia): Match por nombre + set_code exactos
    if not bp:
        bp = bp_by_name_and_set.get((card_name, set_code))

    return bp

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
        print(f"Buscando blueprints para {exp['name']} ({exp['id']})...")
        page = 1
        while True:
            bps_resp = requests.get(f'https://api.cardtrader.com/api/v2/blueprints?game_id={CT_GAME_ID}&expansion_id={exp["id"]}&limit=100&page={page}', headers=CT_HEADERS)
            if bps_resp.status_code == 200:
                data = bps_resp.json()
                if not data:
                    break
                for bp in data:
                    bp['expansion_code'] = exp.get('code', '').lower()
                    all_blueprints.append(bp)
                page += 1
                time.sleep(0.1) # rate limit pagination
            else:
                print(f"Error {bps_resp.status_code} al buscar bps en {exp['id']}")
                break
        time.sleep(0.15)  # rate limit

    print(f"  -> {len(all_blueprints)} blueprints descargados en total.")

    # Construimos un lookup: (name_lower, expansion_code) -> blueprint
    bp_by_name_and_set = {}
    for bp in all_blueprints:
        name = bp.get('name', '').lower().strip()
        exp_code = bp.get('expansion_code', '').lower()
        # Keep the first we see for a given set, or maybe collect all.
        # It's better to just keep it as a simple fallback if collector_number fails.
        if (name, exp_code) not in bp_by_name_and_set:
            bp_by_name_and_set[(name, exp_code)] = bp

    # 3. Bajar todas las card_printings de Gundam desde nuestra BD
    print("Descargando card_printings de Gundam desde Supabase...")
    all_printings = []
    
    # 3.1 Get all Gundam card IDs first (avoids !inner join timeout)
    cards_res = supabase.table('cards').select('card_id, card_name').eq('game_id', 17).execute()
    gundam_cards = {c['card_id']: c['card_name'] for c in cards_res.data}
    gundam_card_ids = list(gundam_cards.keys())
    
    # 3.2 Fetch printings for those cards in chunks
    chunk_size = 200
    for i in range(0, len(gundam_card_ids), chunk_size):
        chunk_ids = gundam_card_ids[i:i+chunk_size]
        res = (supabase.table('card_printings')
               .select('printing_id, card_id, set_code, collector_number, related_uris')
               .in_('card_id', chunk_ids)
               .execute())
        
        # Attach the card_name back for the matching algorithm
        for p in res.data:
            p['cards'] = {'card_name': gundam_cards[p['card_id']], 'game_id': 17}
            all_printings.append(p)

    print(f"  -> {len(all_printings)} printings de Gundam en nuestra BD.")

    # 4. Cruzar y actualizar
    match_count = 0
    no_match = 0

    for printing in all_printings:
        current_uris = printing.get('related_uris') or {}
        cn_raw = printing.get('collector_number') or ''
        bp = find_cardtrader_match(printing, all_blueprints, bp_by_name_and_set)
        
        if bp:
            real_url = f"https://www.cardtrader.com/cards/{bp['slug']}"
            
            # Solo actualizamos si cambió
            if current_uris.get('cardtrader') != real_url:
                current_uris['cardtrader'] = real_url
                supabase.table('card_printings').update({
                    'related_uris': current_uris
                }).eq('printing_id', printing['printing_id']).execute()
            
            match_count += 1
            print(f"OK  {printing['cards']['card_name']} ({cn_raw}) -> {real_url}")
        else:
            no_match += 1
            # Limpiamos el link si tenia uno malo asignado previamente, y el precio
            changed = False
            if 'cardtrader' in current_uris:
                del current_uris['cardtrader']
                changed = True
            
            if printing.get('avg_market_price_usd') is not None:
                changed = True

            # Siempre limpiamos el precio si no hay match de blueprint, para no dejar precios zombie
            if changed:
                supabase.table('card_printings').update({
                    'related_uris': current_uris,
                    'avg_market_price_usd': None
                }).eq('printing_id', printing['printing_id']).execute()

    print(f"\n=== RESUMEN ===")
    print(f"  Actualizados con link real: {match_count}")
    print(f"  Sin match en CardTrader:    {no_match}")
    print(f"\nListo! El frontend ahora usara los links directos de CardTrader.")

if __name__ == '__main__':
    main()
