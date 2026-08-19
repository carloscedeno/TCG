import os, random, uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
supabase = create_client(os.environ['DEV_SUPABASE_URL'], os.environ['DEV_SUPABASE_SERVICE_ROLE_KEY'])

# Limpiar posibles basuras anteriores
supabase.table('products').delete().eq('game', 'GND').execute()

cards = supabase.table('cards').select('card_id, card_name').eq('game_id', 17).execute().data
card_map = {c['card_id']: c['card_name'] for c in cards}

printings = supabase.table('card_printings').select('printing_id, card_id, image_url, avg_market_price_usd').execute().data
gnd_printings = [p for p in printings if p['card_id'] in card_map]

print(f'Found {len(gnd_printings)} true GND printings')

dummy_products = []
sample_size = min(100, len(gnd_printings))
for p in random.sample(gnd_printings, sample_size):
    dummy_products.append({
        'id': str(uuid.uuid4()),
        'name': card_map[p['card_id']],
        'game': 'GND',
        'set_code': 'GND',
        'price': round(p['avg_market_price_usd'] or random.uniform(5, 50), 2),
        'stock': random.randint(1, 10),
        'image_url': p['image_url'],
        'condition': 'NM',
        'finish': 'nonfoil',
        'printing_id': p['printing_id']
    })

res = supabase.table('products').insert(dummy_products).execute()
print('Insertados correctos GND:', len(res.data))
