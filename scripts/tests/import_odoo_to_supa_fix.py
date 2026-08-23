import sys, os, uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

supabase = get_supabase()
odoo = OdooClient()

print("Fetching products from Odoo...")
# Only fetch products that were not updated today (or we can just fetch all and filter locally)
products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [[]], {'fields': ['id', 'name', 'display_name', 'default_code', 'list_price', 'qty_available']})

created_count = 0

for p in products:
    odoo_id = p['id']
    name = p.get('display_name') or p.get('name')
    price = float(p.get('list_price') or 0.0)
    stock = int(p.get('qty_available') or 0)
    default_code = p.get('default_code') or ''
    
    # Skip if it's a UUID (it means it's a Single from Supabase)
    if len(default_code) == 36 and '-' in default_code:
        continue

    # Skip if it's already an accessory in Supabase
    existing = supabase.table('accessories').select('id').eq('odoo_id', odoo_id).execute()
    if existing.data:
        continue
        
    # It's an Odoo product that is missing in Supabase accessories. Let's create it!
    target_id = str(uuid.uuid4())
    supabase.table('accessories').insert({
        'id': target_id,
        'odoo_id': odoo_id,
        'name': name,
        'price': price,
        'stock': stock,
        'category': 'Accesorios',
        'is_active': True,
        'unit_type': 'Unidad',
        'language': 'Spanish'
    }).execute()
    created_count += 1
    # Note: We won't overwrite their default_code in Odoo because they might use it for barcodes.
    # The sync uses odoo_id anyway for accessories!

print(f"Sync complete. Created {created_count} accessories.")
