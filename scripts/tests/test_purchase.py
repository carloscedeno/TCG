import sys, os, uuid
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
supabase_url = 'https://sxuotvogwvmxuvwbsscv.supabase.co'
anon_key = os.environ.get('SUPABASE_ANON_KEY')

# Add project root to python path for scripts module
sys.path.append('e:/TCG Web App')
from scripts.sync.common.db import get_supabase
supabase = get_supabase()

print('Fetching a valid product...')
res = supabase.table('products').select('id, price, name').limit(1).execute()
prod = res.data[0]
print(f"Selected product: {prod['name']}")

dummy_order_id = str(uuid.uuid4())
print(f'Simulating checkout with Web Order ID: {dummy_order_id}')

payload = {
    'action': 'sync_order',
    'order_data': {
        'id': dummy_order_id,
        'customer_email': 'test_buyer@geekorium.com',
        'customer_name': 'Test Buyer',
        'items': [
            {
                'product_id': prod['id'],
                'quantity': 2,
                'price': prod['price']
            }
        ],
        'total': float(prod['price']) * 2
    }
}

print('Calling odoo-sync Edge Function...')
response = httpx.post(f'{supabase_url}/functions/v1/odoo-sync', json=payload, headers={'Authorization': f'Bearer {anon_key}'})
print(f'Status: {response.status_code}')
print(f'Response: {response.text}')

# Check if Odoo actually created the order
import time
time.sleep(2)
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()
orders = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'sale.order', 'search_read', [[['client_order_ref', '=', dummy_order_id]]], {'fields': ['name', 'amount_total', 'state']})
if orders:
    print(f"SUCCESS: Found in Odoo! Sales Order: {orders[0]['name']}, Total: {orders[0]['amount_total']}")
else:
    print('ERROR: Not found in Odoo.')
