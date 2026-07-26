import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.db import get_supabase
from scripts.sync.common.odoo_client import OdooClient

supabase = get_supabase()
odoo = OdooClient()

print("1. Fetching products with stock > 0 from Supabase...")
prod_res = supabase.table('products').select('id, name, stock').gt('stock', 0).execute()
products = prod_res.data
print(f"Found {len(products)} products with stock > 0.")

print("2. Fetching accessories with stock > 0 from Supabase...")
acc_res = supabase.table('accessories').select('id, name, stock, odoo_id').gt('stock', 0).execute()
accessories = acc_res.data
print(f"Found {len(accessories)} accessories with stock > 0.")

print("3. Getting Odoo Stock Location...")
# Buscamos la ubicación principal de inventario (Stock)
locations = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.location', 'search_read', 
                                   [[['usage', '=', 'internal']]], {'fields': ['id', 'name'], 'limit': 1})
if not locations:
    print("No internal stock location found in Odoo!")
    sys.exit(1)
location_id = locations[0]['id']
print(f"Using Stock Location: {locations[0]['name']} (ID: {location_id})")

def update_odoo_stock(odoo_product_id, qty):
    # Asegurarnos de que el producto sea almacenable
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[odoo_product_id], {'is_storable': True}])
    
    # En Odoo 17, el inventario se ajusta creando/escribiendo un stock.quant
    quant_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.quant', 'create', [{
        'product_id': odoo_product_id,
        'location_id': location_id,
        'inventory_quantity': qty,
    }])
    try:
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.quant', 'action_apply_inventory', [[quant_id]])
    except Exception as e:
        if "cannot marshal None" not in str(e):
            raise e

print("4. Updating stock in Odoo...")

success = 0
for p in products:
    # Find in Odoo by default_code
    odoo_prod = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                       [[['default_code', '=', p['id']]]], {'fields': ['id'], 'limit': 1})
    if odoo_prod:
        update_odoo_stock(odoo_prod[0]['id'], p['stock'])
        success += 1

for a in accessories:
    if a.get('odoo_id'):
        odoo_prod = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                           [[['id', '=', a['odoo_id']]]], {'fields': ['id'], 'limit': 1})
    else:
        odoo_prod = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                           [[['default_code', '=', a['id']]]], {'fields': ['id'], 'limit': 1})
    if odoo_prod:
        update_odoo_stock(odoo_prod[0]['id'], a['stock'])
        success += 1

print(f"\nDone! Successfully updated stock for {success} items in Odoo.")
