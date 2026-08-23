import sys, os, uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

supabase = get_supabase()
odoo = OdooClient()

print("Fetching all products from Odoo...")
products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [[]], {'fields': ['id', 'name', 'display_name', 'default_code', 'list_price', 'qty_available']})

print(f"Found {len(products)} products in Odoo.")

created_count = 0
updated_count = 0

for p in products:
    odoo_id = p['id']
    name = p.get('display_name') or p.get('name')
    price = float(p.get('list_price') or 0.0)
    stock = int(p.get('qty_available') or 0)
    default_code = p.get('default_code')
    
    if not default_code:
        # Check if we already created it via odoo_id
        existing = supabase.table('accessories').select('id').eq('odoo_id', odoo_id).execute()
        if existing.data:
            target_id = existing.data[0]['id']
            # Update price/stock
            supabase.table('accessories').update({'price': price, 'stock': stock, 'name': name}).eq('id', target_id).execute()
            updated_count += 1
            # Link back to Odoo
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[odoo_id], {'default_code': target_id}])
        else:
            # Create new accessory
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
            # Link back to Odoo
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[odoo_id], {'default_code': target_id}])
    else:
        # Has default_code, check if it exists in Supabase (products or accessories)
        # We only update price/stock if it exists
        is_in_products = supabase.table('products').select('id').eq('id', default_code).execute()
        if is_in_products.data:
            pass # we don't overwrite products from Odoo, because Web is master for Singles!
        else:
            is_in_acc = supabase.table('accessories').select('id').eq('id', default_code).execute()
            if is_in_acc.data:
                supabase.table('accessories').update({'price': price, 'stock': stock, 'name': name}).eq('id', default_code).execute()
                updated_count += 1

print(f"Sync complete. Created {created_count} accessories, updated {updated_count} existing.")
