
import os
import csv
import json
from supabase import create_client

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

file_path = 'errores_reales_tcg.csv'
header_str = 'Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency'
num_cols = len(header_str.split(','))

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

NAME_OVERRIDES = {
    "Daxos": "Daxos, Blessed by the Sun",
    "Faithful Squire // Kaiso": "Faithful Squire // Kaiso, Memory of Loyalty",
    "Kitsune Mystic // Autumn-Tail": "Kitsune Mystic // Autumn-Tail, Kitsune Sage",
    "Gilraen": "Gilraen, Dúnedain Protector",
    "Ashe": "Ashe, Princess of Dalmasca",
    "Éowyn": "Éowyn, Lady of Rohan",
    "Faramir": "Faramir, Field Commander",
    "Now for Wrath": "Now for Wrath, Now for Ruin!",
    "Fortune": "Fortune, Loyal Steed",
}

import_items = []
for i, line in enumerate(lines[1:]): 
    parts = [p.strip() for p in line.strip().split(',')]
    if len(parts) >= num_cols:
        rest = parts[-(num_cols-1):]
        name = ','.join(parts[:-(num_cols-1)]).strip()
        
        if name in NAME_OVERRIDES: name = NAME_OVERRIDES[name]
        
        # Priority: Try exact name match to get card_id
        res_card = supa.table('cards').select('card_id').ilike('card_name', name).execute()
        if not res_card.data:
            # Try partial
            partial = name.split(',')[0].split(' // ')[0]
            res_card = supa.table('cards').select('card_id').ilike('card_name', partial + '%').limit(1).execute()
        
        if res_card.data:
            cid = res_card.data[0]['card_id']
            # Find a valid printing
            # Try specific set first
            set_code_csv = rest[0].strip()
            res_p = supa.table('card_printings').select('printing_id').eq('card_id', cid).ilike('set_code', set_code_csv).execute()
            
            if not res_p.data:
                # Fallback to any printing
                res_p = supa.table('card_printings').select('printing_id').eq('card_id', cid).limit(1).execute()
            
            if res_p.data:
                pid = res_p.data[0]['printing_id']
                import_items.append({
                    "printing_id": pid,
                    "name": name,
                    "quantity": int(rest[5]) if rest[5].isdigit() else 1,
                    "price": float(rest[8]) if rest[8].replace('.','',1).isdigit() else 0,
                    "condition": rest[11],
                    "finish": "foil" if rest[3].lower() == "true" else "nonfoil"
                })

print(f"Finalized and matched {len(import_items)} out of {i+1} rows.")

# Manual UPSERT because we have printing_ids now
# We bypass the complex RPC and go straight to the products table logic
for item in import_items:
    try:
        # Check if already exists in products
        res_ex = supa.table('products').select('id, stock').eq('printing_id', item['printing_id']).eq('condition', item['condition']).eq('finish', item['finish']).execute()
        
        if res_ex.data:
            # Update
            new_stock = res_ex.data[0]['stock'] + item['quantity']
            supa.table('products').update({'stock': new_stock}).eq('id', res_ex.data[0]['id']).execute()
            print(f"Updated: {item['name']}")
        else:
            # Insert new
            # We need set_code and image_url for the products table (per schema)
            p_details = supa.table('card_printings').select('set_code, image_url_normal, image_url, rarity').eq('printing_id', item['printing_id']).execute()
            details = p_details.data[0]
            
            new_prod = {
                'printing_id': item['printing_id'],
                'name': item['name'],
                'game': 'Magic',
                'set_code': details['set_code'],
                'stock': item['quantity'],
                'price': item['price'],
                'condition': item['condition'],
                'finish': item['finish'],
                'rarity': details['rarity'] or 'Common',
                'image_url': details['image_url_normal'] or details['image_url'] or ''
            }
            supa.table('products').insert(new_prod).execute()
            print(f"Inserted: {item['name']}")
            
    except Exception as e:
        print(f"Failed to upsert {item['name']}: {e}")

# Generate corrected CSV
with open('errores_corregidos_FINAL.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header_str.split(','))
    for item in import_items:
        row = [item['name'], '', '', '', 'true' if item['finish'] == 'foil' else 'false', '', item['quantity'], '', '', item['price'], 'false', 'false', item['condition'], 'en', 'USD']
        writer.writerow(row)
