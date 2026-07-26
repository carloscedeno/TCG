import sys, os, uuid
import httpx
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

print("1. Fetching a user ID for the order...")
res = supabase.table('orders').select('user_id').limit(1).execute()
user_id = res.data[0]['user_id']
print(f"Using user_id: {user_id}")

print("2. Fetching some real products and accessories...")
prod_res = supabase.table('products').select('id, name, price').eq('game', 'MTG').gt('price', 0.50).limit(2).execute()
acc_res = supabase.table('accessories').select('id, name, price').limit(1).execute()
products = prod_res.data
accessories = acc_res.data
print("Selected Products:")
for p in products:
    print(f"- {p['name']} (${p['price']})")
for a in accessories:
    print(f"- [Accessory] {a['name']} (${a['price']})")

print("3. Creating the real order in Supabase...")
simplified_items = []
for p in products:
    simplified_items.append({
        'product_id': p['id'],
        'quantity': 1,
        'price': p['price'],
        'item_type': 'product'
    })
for a in accessories:
    simplified_items.append({
        'accessory_id': a['id'],
        'quantity': 1,
        'price': a['price']
    })
    
total = sum(p['price'] for p in products) + sum(a['price'] for a in accessories)

rpc_payload = {
    'p_user_id': user_id,
    'p_items': simplified_items,
    'p_guest_info': {
        'email': 'carlos.cedeno.balbas@gmail.com',
        'first_name': 'Carlos',
        'last_name': 'Cedeño'
    },
    'p_shipping_address': {
        'address_line1': 'Calle Prueba 123',
        'city': 'Pruebaville',
        'state': 'PR',
        'postal_code': '12345',
        'country': 'CL',
        'first_name': 'Carlos',
        'last_name': 'Cedeño',
        'email': 'carlos.cedeno.balbas@gmail.com',
        'phone': '123456789'
    },
    'p_total_amount': total
}

order_res = supabase.rpc('create_order_atomic', rpc_payload).execute()
web_order_id = order_res.data['order_id']
print(f"SUCCESS: Real order created in Supabase! Web Order ID: {web_order_id}")

print("4. Forwarding to Odoo (via Edge Function odoo-sync)...")
odoo_sync_url = f"{supabase_url}/functions/v1/odoo-sync"
headers = {
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json"
}
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
            print(f"\nSUCCESS! Se ha creado la orden completa de lado y lado:")
            print(f"- Supabase (Web) Order ID: {web_order_id}")
            print(f"- Odoo Sales Order ID: {odoo_id}")
            print("\nAHORA VE A ODOO, busca el pedido, dale a 'Confirmar' y verifica en la base de datos (o dimelo) para ver como se marca como Pagada.")
        else:
            print(f"Error from odoo-sync: {resp.status_code} - {resp.text}")
except Exception as e:
    print(f"Failed to call odoo-sync: {e}")
print("\nAHORA VE A ODOO, busca el pedido, dale a 'Confirmar' y verifica en la base de datos (o dimelo) para ver como se marca como Pagada.")
