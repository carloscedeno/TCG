import os
import sys
import json
import uuid
import time
import requests
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.sync.common.db import get_supabase, setup_logging

logger = setup_logging('GND_Catalog')

GAME_CODE = 'GND'
GAME_ID = 17 # From games table

NAMESPACE_GUNDAM = uuid.uuid5(uuid.NAMESPACE_DNS, 'gundamcardgame.com')

def get_or_create_game(supabase):
    res = supabase.table('games').select('game_id').eq('game_code', GAME_CODE).execute()
    if res.data:
        return res.data[0]['game_id']
    logger.warning(f"Game {GAME_CODE} not found in DB! Cannot proceed.")
    sys.exit(1)

def extract_set_info(series_string):
    # Example: "Premium Card Collection [PC01A]" -> name="Premium Card Collection", code="pc01a"
    # Example: "Dual Impact [GD02]" -> name="Dual Impact", code="gd02"
    if not series_string:
        return "Unknown Set", "unk"
    
    parts = series_string.split('[')
    if len(parts) == 2:
        name = parts[0].strip()
        code = parts[1].replace(']', '').strip().lower()
        return name, code
    
    return series_string.strip(), series_string.strip().lower()[:5]

def generate_id(value_string):
    """Generate an idempotent UUID based on a string."""
    return str(uuid.uuid5(NAMESPACE_GUNDAM, value_string))

def fetch_all_cards():
    """Fetch all cards from the community database."""
    logger.info("Fetching master config from dragogodev/cgs...")
    try:
        master_res = requests.get("https://raw.githubusercontent.com/dragogodev/cgs/master/Gundam/cgs.json", timeout=10)
        master_res.raise_for_status()
        config = master_res.json()
    except Exception as e:
        logger.error(f"Failed to fetch master config: {e}")
        return []
    
    base_url = config.get("allCardsUrl")
    if not base_url:
        logger.error("No allCardsUrl found in config")
        return []

    cards = []
    page = 1
    total_pages = 1
    
    while page <= total_pages:
        url = f"{base_url}&page={page}"
        logger.info(f"Fetching page {page}/{total_pages}...")
        try:
            res = requests.get(url, timeout=10)
            res.raise_for_status()
            data = res.json()
            
            if page == 1:
                total_pages = data.get("meta", {}).get("page_count", 1)
                
            cards.extend(data.get("data", []))
            page += 1
            time.sleep(0.5) # respect rate limit
        except Exception as e:
            logger.error(f"Failed to fetch page {page}: {e}")
            break
            
    logger.info(f"Fetched {len(cards)} total cards.")
    return cards

def sync_catalog():
    supabase = get_supabase()
    game_id = get_or_create_game(supabase)
    
    cards_data = fetch_all_cards()
    if not cards_data:
        logger.error("No cards fetched. Aborting.")
        return
        
    # Build unique sets
    sets_map = {} # code -> {id, name, release_date}
    cards_map = {} # name -> {id, oracle_text, type_line, colors, mana_cost}
    printings = []
    
    for c in cards_data:
        set_name, set_code = extract_set_info(c.get('card_series'))
        if set_code not in sets_map:
            sets_map[set_code] = {
                'set_code': set_code,
                'set_name': set_name,
                'game_id': game_id,
                'release_date': '2025-01-01' # Fallback
            }
            
        card_name = c.get('card_name')
        if not card_name:
            continue
            
        # Collect card info (unique by name)
        if card_name not in cards_map:
            cards_map[card_name] = {
                'card_id': generate_id(f"card-{card_name}"),
                'game_id': game_id,
                'card_name': card_name,
                'mana_cost': str(c.get('card_cost', '')),
                'cmc': c.get('card_cost') if isinstance(c.get('card_cost'), (int, float)) else 0,
                'type_line': c.get('card_type', ''),
                'oracle_text': c.get('card_text_unstyled', ''),
                'colors': [c.get('card_color')] if c.get('card_color') else [],
                'rarity': c.get('card_rarity', '').lower(),
                'tcg_specific_attributes': {
                    'cost_level': c.get('card_level'),
                    'ap': c.get('card_ap'),
                    'hp': c.get('card_hp'),
                    'traits': c.get('card_traits', [])
                }
            }
            
    logger.info(f"Prepared {len(sets_map)} sets, {len(cards_map)} unique cards")

    # Insert into DB
    try:
        # 1. PROCESS SETS
        res_sets = supabase.table('sets').select('set_code, set_id').eq('game_id', game_id).execute()
        existing_sets = {row['set_code']: row['set_id'] for row in res_sets.data}
        
        new_sets = []
        res_max_set = supabase.table('sets').select('set_id').order('set_id', desc=True).limit(1).execute()
        next_set_id = (res_max_set.data[0]['set_id'] if res_max_set.data else 0) + 1
        
        for s in sets_map.values():
            if s['set_code'] not in existing_sets:
                s['set_id'] = next_set_id
                new_sets.append(s)
                next_set_id += 1
                
        if new_sets:
            logger.info(f"Inserting {len(new_sets)} new sets with explicit IDs...")
            res = supabase.table('sets').insert(new_sets).execute()
            for row in res.data:
                existing_sets[row['set_code']] = row['set_id']
                
        logger.info("Sets processed.")

        # 2. PROCESS CARDS
        res_cards = supabase.table('cards').select('card_name, card_id').eq('game_id', game_id).execute()
        existing_cards = {row['card_name']: row['card_id'] for row in res_cards.data}
        
        # cards table uses UUID for card_id, so we can generate it if not present
        new_cards = []
        for c in cards_map.values():
            if c['card_name'] not in existing_cards:
                new_cards.append(c)
                
        if new_cards:
            logger.info(f"Inserting {len(new_cards)} new cards...")
            chunk_size = 50
            for i in range(0, len(new_cards), chunk_size):
                chunk = new_cards[i:i+chunk_size]
                res = supabase.table('cards').insert(chunk).execute()
                for row in res.data:
                    existing_cards[row['card_name']] = row['card_id']
                    
        logger.info("Cards processed.")

        # 3. PROCESS PRINTINGS
        real_cards_map = existing_cards
        real_sets_map = existing_sets

        fixed_printings = []
        for c in cards_data:
            set_name, set_code = extract_set_info(c.get('card_series'))
            card_name = c.get('card_name')
            
            real_card_id = real_cards_map.get(card_name)
            real_set_id = real_sets_map.get(set_code)
            
            if not real_card_id or not real_set_id:
                continue
                
            card_number = c.get('card_number', '')
            img_link = c.get('img_link')
            image_url = f"https://exburst.dev/gundam/cards/hd/{img_link}.webp" if img_link else None
            
            fixed_printings.append({
                'printing_id': generate_id(f"print-{card_number}"),
                'card_id': real_card_id,
                'set_id': real_set_id,
                'set_code': set_code,
                'collector_number': card_number,
                'image_url': image_url,
                'is_foil': False,
                'finishes': ['nonfoil'],
                'rarity': c.get('card_rarity', '').lower()
            })
            
            for v in c.get('variants', []):
                v_num = v.get('card_number', card_number)
                v_img = v.get('img_link')
                v_url = f"https://exburst.dev/gundam/cards/hd/{v_img}.webp" if v_img else image_url
                fixed_printings.append({
                    'printing_id': generate_id(f"print-{v_num}"),
                    'card_id': real_card_id,
                    'set_id': real_set_id,
                    'set_code': set_code,
                    'collector_number': v_num,
                    'image_url': v_url,
                    'is_foil': True if 'PR' in v_num else False,
                    'finishes': ['foil'] if 'PR' in v_num else ['nonfoil'],
                    'rarity': v.get('card_rarity', '').lower()
                })

        seen_p = set()
        final_p = []
        for p in fixed_printings:
            if p['printing_id'] not in seen_p:
                seen_p.add(p['printing_id'])
                final_p.append(p)

        logger.info(f"Prepared {len(final_p)} printings for upsert...")
        for i in range(0, len(final_p), chunk_size):
            chunk = final_p[i:i+chunk_size]
            supabase.table('card_printings').upsert(chunk, on_conflict='printing_id').execute()
            
        logger.info("Printings upserted.")
        logger.info("Catalog sync completed successfully.")
        
    except Exception as e:
        logger.error(f"Error during catalog sync: {e}")

if __name__ == '__main__':
    sync_catalog()
