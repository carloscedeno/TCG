import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(r"e:\TCG Web App\supabase\.env.local"))
load_dotenv(Path(r"e:\TCG Web App\.env"))

sys.path.append(r"e:\TCG Web App")
from supabase import create_client

PROD_URL = os.getenv("PROD_SUPABASE_URL") or "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_KEY = os.getenv("PROD_SUPABASE_ANON_KEY")
prod_supabase = create_client(PROD_URL, PROD_KEY)

backup_path = Path(r"e:\TCG Web App\logs\inventory_backup_before_zeroing_20260830_025046.json")
with open(backup_path, "r", encoding="utf-8") as f:
    data = json.load(f)

products_to_restore = data.get("prod_products_to_zero", [])
print(f"Loaded {len(products_to_restore)} products from backup to restore.")

# Group products by stock value for fast batch updates
stock_groups = {}
for p in products_to_restore:
    stock_val = p['stock']
    p_id = p['id']
    if stock_val not in stock_groups:
        stock_groups[stock_val] = []
    stock_groups[stock_val].append(p_id)

print(f"Grouped into {len(stock_groups)} unique stock levels for batch updates:")
for stock_val, ids in sorted(stock_groups.items(), key=lambda x: x[0]):
    print(f"  Stock level {stock_val}: {len(ids)} items")

batch_size = 100
total_restored = 0

for stock_val, ids in sorted(stock_groups.items(), key=lambda x: x[0]):
    print(f"\nRestoring {len(ids)} products to stock={stock_val}...")
    for i in range(0, len(ids), batch_size):
        chunk = ids[i:i + batch_size]
        res = prod_supabase.table('products').update({'stock': stock_val}).in_('id', chunk).execute()
        total_restored += len(chunk)
        if (i // batch_size) % 20 == 0 or i + batch_size >= len(ids):
            print(f"  Restored {total_restored}/{len(products_to_restore)}...", flush=True)

print(f"\n=== RESTORATION OF SINGLES (PRODUCTS) COMPLETED ===")
print(f"Total singles restored to original stock: {total_restored}")
