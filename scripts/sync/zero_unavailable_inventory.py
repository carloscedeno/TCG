import os
import sys
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load env files
load_dotenv(Path(r"e:\TCG Web App\supabase\.env.local"))
load_dotenv(Path(r"e:\TCG Web App\.env"))
load_dotenv(Path(r"e:\TCG Web App\.env.dev"))

sys.path.append(r"e:\TCG Web App")
from scripts.sync.common.odoo_client import OdooClient
from supabase import create_client

def run_zeroing():
    print("=== STARTING INVENTORY ZEROING PROCESS ===", flush=True)
    
    # 1. Connect to Odoo
    odoo = OdooClient()
    if not odoo.uid:
        print("ERROR: Failed to authenticate with Odoo.", flush=True)
        sys.exit(1)
    
    print(f"Authenticated with Odoo (UID: {odoo.uid})", flush=True)
    
    # 2. Get Odoo positive stock quants
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
    
    odoo_positive_pids = set()
    for q in quants:
        pid = q['product_id'][0]
        if q['quantity'] > 0:
            odoo_positive_pids.add(pid)
            
    print(f"Odoo unique products with positive stock in internal locations: {len(odoo_positive_pids)}", flush=True)
    
    # Fetch product definitions from Odoo
    limit = 5000
    offset = 0
    odoo_by_code = {}
    odoo_by_id = {}
    
    while True:
        prods = odoo.models.execute_kw(
            odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[]],
            {'fields': ['id', 'default_code', 'active'], 'limit': limit, 'offset': offset}
        )
        if not prods:
            break
        for p in prods:
            p_id = p['id']
            has_stock = (p_id in odoo_positive_pids) and p.get('active', True)
            p['has_stock'] = has_stock
            
            code = p.get('default_code')
            if code:
                odoo_by_code[str(code).strip()] = p
            odoo_by_id[p_id] = p
            
        if len(prods) < limit:
            break
        offset += limit
        
    print(f"Loaded {len(odoo_by_id)} total product definitions from Odoo.", flush=True)
    
    # 3. Setup Supabase clients
    DEV_URL = os.getenv("DEV_SUPABASE_URL") or "https://bqfkqnnostzaqueujdms.supabase.co"
    DEV_KEY = os.getenv("DEV_SUPABASE_SERVICE_ROLE_KEY")
    dev_supabase = create_client(DEV_URL, DEV_KEY)
    
    PROD_URL = os.getenv("PROD_SUPABASE_URL") or "https://sxuotvogwvmxuvwbsscv.supabase.co"
    PROD_KEY = os.getenv("PROD_SUPABASE_ANON_KEY")
    prod_supabase = create_client(PROD_URL, PROD_KEY)
    
    def fetch_all_with_stock(client, table_name, select_cols):
        all_data = []
        page_size = 1000
        offset = 0
        while True:
            res = client.table(table_name).select(select_cols).gt('stock', 0).range(offset, offset + page_size - 1).execute()
            data = res.data
            if not data:
                break
            all_data.extend(data)
            if len(data) < page_size:
                break
            offset += page_size
        return all_data

    # Fetch items with stock > 0
    print("\nFetching current positive inventory from PROD...", flush=True)
    prod_products = fetch_all_with_stock(prod_supabase, 'products', 'id, stock, price')
    try:
        prod_acc = fetch_all_with_stock(prod_supabase, 'accessories', 'id, name, stock, price')
    except Exception:
        prod_acc = []
        
    print(f"PROD Products with stock > 0: {len(prod_products)}", flush=True)
    print(f"PROD Accessories with stock > 0: {len(prod_acc)}", flush=True)
    
    # Filter PROD items to zero out
    prod_products_to_zero = []
    for p in prod_products:
        p_id = str(p['id']).strip()
        if p_id not in odoo_by_code or not odoo_by_code[p_id]['has_stock']:
            prod_products_to_zero.append(p)
            
    prod_acc_to_zero = []
    for a in prod_acc:
        a_id = str(a['id']).strip()
        if a_id not in odoo_by_code or not odoo_by_code[a_id]['has_stock']:
            prod_acc_to_zero.append(a)
            
    print(f"PROD Products identified to zero out: {len(prod_products_to_zero)}", flush=True)
    print(f"PROD Accessories identified to zero out: {len(prod_acc_to_zero)}", flush=True)
    
    # 4. BACKUP
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_dir = Path(r"e:\TCG Web App\logs")
    log_dir.mkdir(exist_ok=True)
    backup_file = log_dir / f"inventory_backup_before_zeroing_{timestamp}.json"
    
    backup_data = {
        "timestamp": timestamp,
        "prod_products_to_zero": prod_products_to_zero,
        "prod_accessories_to_zero": prod_acc_to_zero
    }
    
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
    print(f"\n[BACKUP CREATED] Saved backup file to: {backup_file}", flush=True)
    
    # 5. EXECUTE UPDATES IN PROD
    batch_size = 100
    
    # Zero out PROD products
    if prod_products_to_zero:
        print(f"\nZeroing out {len(prod_products_to_zero)} products in PROD...", flush=True)
        prod_ids = [p['id'] for p in prod_products_to_zero]
        updated_count = 0
        for i in range(0, len(prod_ids), batch_size):
            chunk = prod_ids[i:i + batch_size]
            res = prod_supabase.table('products').update({'stock': 0}).in_('id', chunk).execute()
            updated_count += len(chunk)
            if (i // batch_size) % 10 == 0 or i + batch_size >= len(prod_ids):
                print(f"  Updated {updated_count}/{len(prod_ids)} products...", flush=True)
                
    # Zero out PROD accessories
    if prod_acc_to_zero:
        print(f"\nZeroing out {len(prod_acc_to_zero)} accessories in PROD...", flush=True)
        acc_ids = [a['id'] for a in prod_acc_to_zero]
        updated_count = 0
        for i in range(0, len(acc_ids), batch_size):
            chunk = acc_ids[i:i + batch_size]
            res = prod_supabase.table('accessories').update({'stock': 0}).in_('id', chunk).execute()
            updated_count += len(chunk)
            print(f"  Updated {updated_count}/{len(acc_ids)} accessories...", flush=True)
            
    print("\n=== INVENTORY ZEROING COMPLETED SUCCESSFULLY ===", flush=True)
    print(f"Summary:")
    print(f"  - Products zeroed in PROD: {len(prod_products_to_zero)}")
    print(f"  - Accessories zeroed in PROD: {len(prod_acc_to_zero)}")

if __name__ == "__main__":
    run_zeroing()
