import sys, os, httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
supabase_url = 'https://bqfkqnnostzaqueujdms.supabase.co'
anon_key = os.environ.get('SUPABASE_ANON_KEY')
sys.path.append('e:/TCG Web App')
from scripts.sync.common.db import get_supabase
from scripts.sync.common.odoo_client import OdooClient

supabase = get_supabase()
odoo = OdooClient()

print("1. Set stock for test cards and accessories in Supabase and Odoo...")
# We need to make sure we have stock in Supabase and Odoo to pass the new rule
prod_res = supabase.table('products').select('id, name, price').eq('game', 'MTG').gt('price', 0.50).limit(2).execute()
acc_res = supabase.table('accessories').select('id, name, price, odoo_id').limit(1).execute()

products = prod_res.data
accessories = acc_res.data

# Give them stock in Supabase
for p in products:
    supabase.table('products').update({'stock': 10}).eq('id', p['id']).execute()
for a in accessories:
    supabase.table('accessories').update({'stock': 10}).eq('id', a['id']).execute()

# Give them stock in Odoo
location_id = 5 # Stock
for p in products:
    odoo_prod = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                       [[['default_code', '=', p['id']]]], {'fields': ['id'], 'limit': 1})
    if odoo_prod:
        oid = odoo_prod[0]['id']
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[oid], {'is_storable': True}])
        qid = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.quant', 'create', [{
            'product_id': oid, 'location_id': location_id, 'inventory_quantity': 10}])
        try:
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.quant', 'action_apply_inventory', [[qid]])
        except Exception as e:
            if "cannot marshal None" not in str(e):
                raise e

for a in accessories:
    oid_search = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                       [[['id', '=', a.get('odoo_id') or 0]]], {'fields': ['id'], 'limit': 1})
    if not oid_search:
        oid_search = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', 
                                           [[['default_code', '=', a['id']]]], {'fields': ['id'], 'limit': 1})
    if oid_search:
        oid = oid_search[0]['id']
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[oid], {'is_storable': True}])
        qid = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.quant', 'create', [{
            'product_id': oid, 'location_id': location_id, 'inventory_quantity': 10}])
        try:
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'stock.quant', 'action_apply_inventory', [[qid]])
        except Exception as e:
            if "cannot marshal None" not in str(e):
                raise e

print("2. Fetching user ID for carlos.cedeno.balbas@gmail.com...")
# Assuming carlos has made an order before, we can just fetch any user_id or we can fetch a specific order
res = supabase.table('orders').select('user_id').limit(1).execute()
user_id = res.data[0]['user_id']
print(f"Using user_id: {user_id}")

print("3. Preparing checkout payload for verify_stock...")
simplified_items = []
for p in products:
    simplified_items.append({'product_id': p['id'], 'quantity': 1, 'price': p['price'], 'name': p['name']})
for a in accessories:
    simplified_items.append({'accessory_id': a['id'], 'quantity': 1, 'price': a['price'], 'name': a['name']})

total = sum(p['price'] for p in products) + sum(a['price'] for a in accessories)

print("4. Calling verify_stock (like the API does)...")
odoo_sync_url = f"{supabase_url}/functions/v1/odoo-sync"
headers = {"Authorization": f"Bearer {anon_key}", "Content-Type": "application/json"}
verify_payload = {"action": "verify_stock", "payload": {"items": simplified_items}}

try:
    with httpx.Client() as client:
        resp = client.post(odoo_sync_url, json=verify_payload, headers=headers, timeout=20.0)
        verify_json = resp.json()
        if not verify_json.get('success'):
            print("VERIFY STOCK FAILED (This proves the rule works!):", verify_json)
            sys.exit(1)
        else:
            print("VERIFY STOCK PASSED! Inventory exists.")
except Exception as e:
    print(f"Failed to verify stock: {e}")
    sys.exit(1)

print("5. Creating order in Supabase...")
rpc_payload = {
    'p_user_id': user_id,
    'p_items': [ {k:v for k,v in i.items() if k != 'name'} for i in simplified_items ],
    'p_guest_info': {'email': 'carlos.cedeno.balbas@gmail.com', 'first_name': 'Carlos', 'last_name': 'Cedeño'},
    'p_shipping_address': {'address_line1': 'Prueba', 'city': 'Prueba', 'state': 'PR', 'postal_code': '123', 'country': 'CL', 'first_name': 'Carlos', 'last_name': 'Cedeño', 'email': 'carlos.cedeno.balbas@gmail.com', 'phone': '123456789'},
    'p_total_amount': total
}

order_res = supabase.rpc('create_order_atomic', rpc_payload).execute()
web_order_id = order_res.data['order_id']
print(f"SUCCESS: Real order created in Supabase! Web Order ID: {web_order_id}")

print("6. Forwarding to Odoo (via sync_order)...")
payload = {
    "action": "sync_order",
    "order_data": {
        "id": web_order_id,
        "customer_email": 'carlos.cedeno.balbas@gmail.com',
        "customer_name": 'Carlos Cedeño',
        "items": simplified_items,
        "total": total
    }
}

try:
    with httpx.Client() as client:
        resp = client.post(odoo_sync_url, json=payload, headers=headers, timeout=20.0)
        if resp.status_code == 200:
            odoo_id = resp.json().get('order_id')
            print(f"\nSUCCESS! Se ha creado la orden completa:")
            print(f"- Supabase (Web) Order ID: {web_order_id}")
            print(f"- Odoo Sales Order ID: {odoo_id}")
            print("\nAHORA VE A ODOO, busca el pedido y Confirmalo.")
        else:
            print(f"Error from odoo-sync: {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"Failed to call odoo-sync: {e}")
