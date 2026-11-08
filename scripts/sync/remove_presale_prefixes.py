import os
import sys
import re
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(r"e:\TCG Web App\supabase\.env.local"))
load_dotenv(Path(r"e:\TCG Web App\.env"))
load_dotenv(Path(r"e:\TCG Web App\.env.dev"))

sys.path.append(r"e:\TCG Web App")
from supabase import create_client

DEV_URL = os.getenv("DEV_SUPABASE_URL") or "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = os.getenv("DEV_SUPABASE_SERVICE_ROLE_KEY")
dev_supabase = create_client(DEV_URL, DEV_KEY)

PROD_URL = os.getenv("PROD_SUPABASE_URL") or "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_KEY = os.getenv("PROD_SUPABASE_ANON_KEY")
prod_supabase = create_client(PROD_URL, PROD_KEY)

def clean_presale_name(name):
    if not name:
        return name
    # Remove variations like (Preventa), (preventa), (preventa marvel), (Preventa)  , etc.
    cleaned = re.sub(r'\(\s*preventa\s*([a-z0-9_-]+\s*)?\)', '', name, flags=re.IGNORECASE)
    cleaned = re.sub(r'^\s*preventa\s+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned

def clean_table_presales(client, env_name, table_name):
    print(f"\n--- Checking table '{table_name}' in {env_name} ---", flush=True)
    page_size = 1000
    offset = 0
    all_records = []
    while True:
        res = client.table(table_name).select('id, name').range(offset, offset + page_size - 1).execute()
        if not res.data:
            break
        all_records.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size
        
    to_update = []
    for r in all_records:
        name = r.get('name', '')
        if name and 'preventa' in name.lower():
            new_name = clean_presale_name(name)
            if new_name != name:
                to_update.append({"id": r['id'], "old_name": name, "new_name": new_name})
                
    print(f"Found {len(to_update)} items with 'preventa' in {env_name} {table_name}.", flush=True)
    
    updated_count = 0
    for item in to_update:
        client.table(table_name).update({'name': item['new_name']}).eq('id', item['id']).execute()
        updated_count += 1
        if updated_count % 20 == 0 or updated_count == len(to_update):
            print(f"  Updated {updated_count}/{len(to_update)} items...", flush=True)
            
    return len(to_update)

print("Starting Presale Prefix Clean Up...", flush=True)
prod_acc_updated = clean_table_presales(prod_supabase, "PROD", "accessories")
dev_acc_updated = clean_table_presales(dev_supabase, "DEV", "accessories")

print("\n=== PRESALE PREFIX CLEAN UP COMPLETED ===", flush=True)
print(f"Total updated in PROD accessories: {prod_acc_updated}")
print(f"Total updated in DEV accessories: {dev_acc_updated}")
