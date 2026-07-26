import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

print("1. Buscando productos de TCG (cartas y accesorios) en Odoo...")
# Buscar todos los productos que actualmente son 'consu' (consumibles)
products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                  [[['type', '=', 'consu']]], 
                                  {'fields': ['name', 'type', 'categ_id']})

print(f"Se encontraron {len(products)} productos consumibles.")

if not products:
    print("No hay productos consumibles que actualizar.")
    sys.exit(0)

# Actualizar en lotes (batch)
batch_size = 100
total = len(products)
product_ids = [p['id'] for p in products]

print("2. Actualizando a 'is_storable' (almacenable)...")
for i in range(0, total, batch_size):
    batch_ids = product_ids[i:i+batch_size]
    print(f"Actualizando lote {i} a {i+len(batch_ids)} de {total}...")
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', 
                           [batch_ids, {'is_storable': True}])

print("3. Verificando actualización...")
updated = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_count', 
                                  [[['id', 'in', product_ids], ['is_storable', '=', True]]])
print(f"Se actualizaron exitosamente {updated} productos a 'Almacenable' (is_storable=True).")
