
import os
import json
from supabase import create_client

def get_env():
    env = {}
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    parts = line.strip().split('=', 1)
                    if len(parts) == 2:
                        k, v = parts
                        env[k] = v
    return env

env = get_env()
url = env.get('SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY')
supa = create_client(url, key)

# 1. Total products with price 0
count_res = supa.table('products').select('id', count='exact').eq('price', 0).execute()
print(f'Total products with price 0: {count_res.count}')

# 2. Get samples and check if they exist in aggregated_prices
res = supa.table('products').select('name, set_code, price, printing_id, rarity').eq('price', 0).limit(10).execute()
print('\nSample 0-price products and their status in aggregated_prices:')

for r in res.data:
    agg_res = supa.table('aggregated_prices').select('usd, usd_foil, last_updated').eq('printing_id', r['printing_id']).execute()
    status = 'FOUND' if agg_res.data else 'NOT FOUND'
    prices = f\"(USD: {agg_res.data[0]['usd']}, Foil: {agg_res.data[0]['usd_foil']})\" if agg_res.data else ''
    print(f\"{r['name']} ({r['set_code']}) - {r['rarity']} -> agg_prices: {status} {prices}\")
