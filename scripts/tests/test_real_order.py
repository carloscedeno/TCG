import sys, os, uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.db import get_supabase
from scripts.sync.common.odoo_client import OdooClient

supabase = get_supabase()
odoo = OdooClient()

print("1. Fetching a user ID for the order...")
res = supabase.table('orders').select('user_id').limit(1).execute()
user_id = res.data[0]['user_id']
print(f"Using user_id: {user_id}")

print("2. Fetching some real products...")
prod_res = supabase.table('products').select('id, name, price').eq('game', 'MTG').gt('price', 0.50).limit(3).execute()
products = prod_res.data
print("Selected Products:")
for p in products:
    print(f"- {p['name']} (${p['price']})")

print("3. Creating the real order in Supabase...")
simplified_items = [
    {
        'product_id': p['id'],
        'quantity': 1,
        'price': p['price'],
        'name': p['name']
    } for p in products
]
total = sum(p['price'] for p in products)

rpc_payload = {
    'p_user_id': user_id,
    'p_items': simplified_items,
    'p_shipping_address': {'email': 'carlos.prueba.real@geekorium.com', 'full_name': 'Carlos Prueba Real', 'address_line1': 'Prueba 123'},
    'p_total_amount': total
}

order_res = supabase.rpc('create_order_atomic', rpc_payload).execute()
order_id = order_res.data['order_id']
print(f"SUCCESS: Real order created in Supabase! Web Order ID: {order_id}")

print("4. Forwarding to Odoo (bypassing the broken Edge Function for this test)...")
partner_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'res.partner', 'search', [[['email', '=', 'carlos.prueba.real@geekorium.com']]])
if not partner_id:
    partner_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'res.partner', 'create', [{
        'name': 'Carlos Prueba Real',
        'email': 'carlos.prueba.real@geekorium.com',
    }])
else:
    partner_id = partner_id[0]

order_lines = []
for p in products:
    odoo_prod = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search', [[['default_code', '=', p['id']]]])
    if odoo_prod:
        order_lines.append([0, 0, {
            'product_id': odoo_prod[0],
            'product_uom_qty': 1,
            'price_unit': p['price']
        }])

if not order_lines:
    print("ERROR: Failed to find any of these products in Odoo. Can't create Sales Order.")
    sys.exit(1)

odoo_order_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'sale.order', 'create', [{
    'partner_id': partner_id,
    'order_line': order_lines,
    'client_order_ref': order_id
}])

odoo_order = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'sale.order', 'read', [[odoo_order_id]], {'fields': ['name']})[0]

print(f"\nSUCCESS! Se ha creado la orden completa de lado y lado:")
print(f"- Supabase (Web) Order ID: {order_id}")
print(f"- Odoo Sales Order: {odoo_order['name']}")
print("\n👉 AHORA VE A ODOO, busca el pedido, dale a 'Confirmar' y verifica en la base de datos (o dimelo) para ver como se marca como Pagada.")
