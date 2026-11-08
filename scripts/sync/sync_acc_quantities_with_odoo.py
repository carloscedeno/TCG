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
from scripts.sync.common.odoo_client import OdooClient
from supabase import create_client

def normalize(s):
    if not s: return ""
    s = re.sub(r'[\(\)\[\]\-\:\,\.\'\"]', ' ', str(s)).lower()
    return " ".join(s.split())

def run_sync():
    print("=== SYNCING NON-SINGLE PRODUCT QUANTITIES WITH ODOO ===", flush=True)
    
    # 1. Connect to Odoo
    odoo = OdooClient()
    if not odoo.uid:
        print("ERROR: Failed to connect to Odoo.", flush=True)
        sys.exit(1)
        
    locations = odoo.models.execute_kw(
        odoo.db, odoo.uid, odoo.password,
        'stock.location', 'search_read',
        [[['usage', '=', 'internal']]],
        {'fields': ['id', 'name']}
    )
    internal_loc_ids = [l['id'] for l in locations]
    
    quants = odoo.models.execute_kw(
        odoo.db, odoo.uid, odoo.password,
        'stock.quant', 'search_read',
        [[['location_id', 'in', internal_loc_ids], ['quantity', '>', 0]]],
        {'fields': ['product_id', 'quantity'], 'limit': 50000}
    )
    
    odoo_stock_map = {}
    for q in quants:
        pid = q['product_id'][0]
        odoo_stock_map[pid] = odoo_stock_map.get(pid, 0) + int(q['quantity'])
        
    limit = 5000
    offset = 0
    odoo_prods = []
    while True:
        prods = odoo.models.execute_kw(
            odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[]],
            {'fields': ['id', 'name', 'default_code', 'active'], 'limit': limit, 'offset': offset}
        )
        if not prods:
            break
        for p in prods:
            p['real_stock'] = odoo_stock_map.get(p['id'], 0)
            odoo_prods.append(p)
        if len(prods) < limit:
            break
        offset += limit
        
    odoo_name_map = {normalize(p['name']): p for p in odoo_prods if p.get('name')}
    odoo_by_id = {p['id']: p for p in odoo_prods}

    PROD_URL = os.getenv("PROD_SUPABASE_URL") or "https://sxuotvogwvmxuvwbsscv.supabase.co"
    PROD_KEY = os.getenv("PROD_SUPABASE_ANON_KEY")
    prod_supabase = create_client(PROD_URL, PROD_KEY)
    
    DEV_URL = os.getenv("DEV_SUPABASE_URL") or "https://bqfkqnnostzaqueujdms.supabase.co"
    DEV_KEY = os.getenv("DEV_SUPABASE_SERVICE_ROLE_KEY")
    dev_supabase = create_client(DEV_URL, DEV_KEY)
    
    dev_acc_list = dev_supabase.table('accessories').select('id, name, odoo_id, stock').execute().data
    dev_name_to_odoo = {normalize(a['name']): a for a in dev_acc_list if a.get('name')}

    def sync_table_stock(client, env_name):
        print(f"\n--- Syncing stock in {env_name} accessories ---", flush=True)
        acc_list = client.table('accessories').select('id, name, stock').execute().data
        
        updates = []
        for a in acc_list:
            a_id = a['id']
            a_name = a.get('name', '')
            a_stock = a.get('stock', 0)
            p_norm = normalize(a_name)
            
            odoo_item = None
            if p_norm in dev_name_to_odoo and dev_name_to_odoo[p_norm].get('odoo_id'):
                oid = dev_name_to_odoo[p_norm]['odoo_id']
                odoo_item = odoo_by_id.get(oid)
                
            if not odoo_item and p_norm in odoo_name_map:
                odoo_item = odoo_name_map[p_norm]
                
            if not odoo_item:
                for norm_k, o_p in odoo_name_map.items():
                    if len(p_norm) > 10 and (p_norm in norm_k or norm_k in p_norm):
                        odoo_item = o_p
                        break
                        
            target_stock = odoo_item['real_stock'] if odoo_item else 0
            
            if a_stock != target_stock:
                updates.append({"id": a_id, "name": a_name, "old_stock": a_stock, "new_stock": target_stock})
                
        print(f"Found {len(updates)} items requiring stock adjustment in {env_name}.", flush=True)
        
        updated_count = 0
        for u in updates:
            client.table('accessories').update({'stock': u['new_stock']}).eq('id', u['id']).execute()
            updated_count += 1
            if updated_count % 20 == 0 or updated_count == len(updates):
                print(f"  Synced {updated_count}/{len(updates)} items in {env_name}...", flush=True)
                
        return len(updates)

    prod_synced = sync_table_stock(prod_supabase, "PROD")
    dev_synced = sync_table_stock(dev_supabase, "DEV")
    
    print("\n=== ACCURATE STOCK QUANTITY SYNC COMPLETED ===", flush=True)
    print(f"Total accessories updated in PROD: {prod_synced}")
    print(f"Total accessories updated in DEV: {dev_synced}")

if __name__ == "__main__":
    run_sync()
