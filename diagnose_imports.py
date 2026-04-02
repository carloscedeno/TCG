
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
                    # Handle potential multiple = in the line (like in keys)
                    parts = line.strip().split('=', 1)
                    if len(parts) == 2:
                        k, v = parts
                        env[k] = v
    return env

env = get_env()
url = env.get('SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print('Missing Supabase URL or Key in .env')
    exit(1)

supa = create_client(url, key)

file_path = 'errores_reales_tcg.csv'

if not os.path.exists(file_path):
    print(f'File {file_path} not found.')
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

results = []
for row in rows:
    name = row['Name'].strip()
    set_code = row['Set code'].strip()
    collector_number = row.get('Collector number', '').strip()
    
    # 1. Check exact name match
    res = supa.table('cards').select('card_id, card_name').ilike('card_name', name).execute()
    
    diagnosis = 'Unknown'
    corrected_data = row.copy()
    
    if not res.data:
        # Check partial name for DFC or common mismatches
        partial = name.split(' // ')[0]
        res_partial = supa.table('cards').select('card_id, card_name').ilike('card_name', partial + ' // %').execute()
        if res_partial.data:
            db_name = res_partial.data[0]['card_name']
            diagnosis = f"DFC Name Mismatch. DB has '{db_name}'. CSV had '{name}'."
            corrected_data['Name'] = db_name
        else:
            # Check for name without special marks or accents
            # Check and suggest similarly named cards?
            res_similar = supa.table('cards').select('card_name').ilike('card_name', f'%{partial}%').limit(3).execute()
            similar_names = [r['card_name'] for r in res_similar.data]
            diagnosis = f"Card Name '{name}' not found. Similar in DB: {', '.join(similar_names)}"
    else:
        card_id = res.data[0]['card_id']
        # Check printing with set_code
        res_p = supa.table('card_printings').select('printing_id, set_code, collector_number').eq('card_id', card_id).ilike('set_code', set_code).execute()
        
        if not res_p.data:
            # List available sets
            all_s = supa.table('card_printings').select('set_code').eq('card_id', card_id).execute()
            set_list = list(set(s['set_code'] for s in all_s.data))
            diagnosis = f"Set code '{set_code}' mismatch for '{name}'. Found in sets: {', '.join(set_list)}"
            
            # Auto-correct if only one set exists
            if len(set_list) == 1:
                corrected_data['Set code'] = set_list[0]
        else:
            # Printing exists, check collector number
            if collector_number:
                res_cn = supa.table('card_printings').select('printing_id').eq('card_id', card_id).ilike('set_code', set_code).eq('collector_number', collector_number).execute()
                if not res_cn.data:
                    # Let's see what the collector number is in DB for this set
                    db_cn = res_p.data[0]['collector_number']
                    diagnosis = f"Collector number mismatch for '{name}' in {set_code}. DB has '{db_cn}', CSV had '{collector_number}'."
                    corrected_data['Collector number'] = db_cn
                else:
                    diagnosis = 'Card found! Import should have worked (check server logs).'
            else:
                diagnosis = 'Card found! Collector number missing in CSV but available in DB.'
                
    results.append({
        'Original Name': name,
        'Set': set_code,
        'Diagnosis': diagnosis,
        'Corrected Name': corrected_data['Name'],
        'Corrected Set': corrected_data['Set code'],
        'Corrected Collector': corrected_data.get('Collector number', '')
    })

print(json.dumps(results, indent=2))

# Write corrected CSV
out_path = 'errores_corregidos_tcg.csv'
with open(out_path, 'w', encoding='utf-8', newline='') as f:
    if rows:
        fieldnames = list(rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for idx, row in enumerate(rows):
            row['Name'] = results[idx]['Corrected Name']
            row['Set code'] = results[idx]['Corrected Set']
            if 'Collector number' in fieldnames:
                row['Collector number'] = results[idx]['Corrected Collector']
            writer.writerow(row)
