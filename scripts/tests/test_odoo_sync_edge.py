import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.db import get_supabase

supabase = get_supabase()

print("1. Fetching a real product...")
prod_res = supabase.table('products').select('id, name, price').gt('price', 0).limit(1).execute()
p = prod_res.data[0]
print(f"Selected: {p['name']} (${p['price']})")

print("2. Fetching a user ID...")
user_res = supabase.table('orders').select('user_id').limit(1).execute()
user_id = user_res.data[0]['user_id']

print("3. Creating Web Order...")
rpc_payload = {
    'p_user_id': user_id,
    'p_items': [{'product_id': p['id'], 'quantity': 1, 'price': p['price'], 'name': p['name']}],
    'p_shipping_address': {'email': 'test.edge@geekorium.com', 'full_name': 'Test Edge', 'address_line1': 'Prueba 1'},
    'p_total_amount': p['price']
}
order_res = supabase.rpc('create_order_atomic', rpc_payload).execute()
order_id = order_res.data['order_id']
print(f"Web Order ID: {order_id}")

print("4. Invoking odoo-sync Edge Function...")
func_res = supabase.functions.invoke('odoo-sync', invoke_options={
    'body': {
        'action': 'sync_order',
        'order_data': {
            'id': order_id,
            'customer_email': 'test.edge@geekorium.com',
            'customer_name': 'Test Edge',
            'items': [
                {'product_id': p['id'], 'quantity': 1, 'price': p['price']}
            ]
        }
    }
})

# The invoke returns a FunctionResponse object which has .data
print(f"Edge Function Response: {func_res.data if hasattr(func_res, 'data') else func_res}")
