
import os
import csv
import json
from supabase import create_client

# Define context and configuration
FIX_DIR = 'data/to_fix'
PROCESSED_DIR = os.path.join(FIX_DIR, 'processed')
HEADER_LEN = 15 # Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency

def get_env():
    env = {}
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    parts = line.strip().split('=', 1)
                    if len(parts) == 2:
                        k, v = parts
                        env[k] = v
    return env

env = get_env()
url = env.get('SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY')
supa = create_client(url, key)

if not os.path.exists(PROCESSED_DIR):
    os.makedirs(PROCESSED_DIR)

files = [f for f in os.listdir(FIX_DIR) if f.endswith('.txt')]
print(f"Total files to process: {len(files)}")

total_matched = 0
total_skipped = 0

for file in files:
    full_path = os.path.join(FIX_DIR, file)
    print(f"\nProcessing {file}...")
    
    with open(full_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if len(lines) <= 1: continue # Only header
    
    items_to_import = []
    
    for i, line in enumerate(lines[1:]):
        parts = [p.strip() for p in line.strip().split(',')]
        if len(parts) < HEADER_LEN: continue # Corrupt line
        
        # Tail-parsing for column stability
        rest = parts[-(HEADER_LEN-1):]
        raw_name = ','.join(parts[:-(HEADER_LEN-1)]).strip()
        
        # 1. Smart Matching card name
        # Pre-clean DFC if it has specific suffixes like ' // ' missing
        clean_name = raw_name
        
        res_card = supa.table('cards').select('card_id, card_name').ilike('card_name', clean_name).execute()
        if not res_card.data:
            # Try partial if it is a DFC name
            partial = clean_name.split(' // ')[0]
            res_card = supa.table('cards').select('card_id, card_name').ilike('card_name', partial + ' // %').execute()
        
        if res_card.data:
            cid = res_card.data[0]['card_id']
            card_name_db = res_card.data[0]['card_name']
            
            # Find a matching printing (Set code is at rest[0])
            set_code_csv = rest[0]
            res_p = supa.table('card_printings').select('printing_id, set_code, image_url_normal, image_url, rarity').eq('card_id', cid).ilike('set_code', set_code_csv).execute()
            
            if not res_p.data:
                # Fallback to ANY printing
                res_p = supa.table('card_printings').select('printing_id, set_code, image_url_normal, image_url, rarity').eq('card_id', cid).limit(1).execute()
                
            if res_p.data:
                p_info = res_p.data[0]
                # Prepare item for import
                item = {
                    'printing_id': p_info['printing_id'],
                    'name': card_name_db,
                    'set_code': p_info['set_code'],
                    'stock': int(rest[5]) if rest[5].isdigit() else 1,
                    'price': float(rest[8]) if rest[8].replace('.','',1).isdigit() else 0,
                    'condition': rest[11],
                    'finish': 'foil' if rest[3].lower() == 'true' else 'nonfoil',
                    'rarity': p_info.get('rarity') or 'Common',
                    'image_url': p_info.get('image_url_normal') or p_info.get('image_url') or ''
                }
                items_to_import.append(item)
            else:
                print(f"  [MISSING PRINTING] for card '{card_name_db}'")
                total_skipped += 1
        else:
            # Token or unknown card
            # print(f"  [SKIPPED] Card name '{clean_name}' not found.")
            total_skipped += 1

    # 2. Execute Batch Upsert
    if items_to_import:
        for item in items_to_import:
            try:
                # Check for existing product to ADD stock
                res_ex = supa.table('products').select('id, stock').eq('printing_id', item['printing_id']).eq('condition', item['condition']).eq('finish', item['finish']).execute()
                
                if res_ex.data:
                    new_stock = res_ex.data[0]['stock'] + item['stock']
                    supa.table('products').update({'stock': new_stock}).eq('id', res_ex.data[0]['id']).execute()
                else:
                    new_prod = {
                        'printing_id': item['printing_id'],
                        'name': item['name'],
                        'game': 'Magic', # Static for now
                        'set_code': item['set_code'],
                        'stock': item['stock'],
                        'price': item['price'],
                        'condition': item['condition'],
                        'finish': item['finish'],
                        'rarity': item['rarity'],
                        'image_url': item['image_url']
                    }
                    supa.table('products').insert(new_prod).execute()
                total_matched += 1
            except Exception as e:
                print(f"  [ERROR] FAILED TO IMPORT {item['name']}: {e}")
                
    # 3. Move to processed
    os.rename(full_path, os.path.join(PROCESSED_DIR, file))

print(f"\nBATCH RESULT: Successfully matched and imported {total_matched} items.")
print(f"TOTAL SKIPPED (Tokens/Unknown): {total_skipped}")
