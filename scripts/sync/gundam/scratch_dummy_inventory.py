import os
import random
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
supabase = create_client(os.environ['DEV_SUPABASE_URL'], os.environ['DEV_SUPABASE_SERVICE_ROLE_KEY'])

# 1. Obtener card_ids de Gundam
cards_res = supabase.table('cards').select('card_id').eq('game_id', 17).execute()
gundam_card_ids = {c['card_id'] for c in cards_res.data}

if not gundam_card_ids:
    print("No hay cartas de Gundam en BD.")
    exit(1)

# 2. Obtener printings de esas cartas (traigo todos y filtro en python para evitar error API)
all_printings = supabase.table('card_printings').select('printing_id, card_id').execute().data
gundam_printings = [p['printing_id'] for p in all_printings if p['card_id'] in gundam_card_ids]

if not gundam_printings:
    print("No hay printings de Gundam.")
    exit(1)

print(f"Encontrados {len(gundam_printings)} printings de Gundam.")

# Actualizarles un precio dummy a los printings para que no salgan en Null en la UI
for pid in gundam_printings:
    supabase.table('card_printings').update({'avg_market_price_usd': random.uniform(10.0, 50.0)}).eq('printing_id', pid).execute()

# 3. Generar 100 productos dummy
dummy_products = []
for i in range(100):
    pid = random.choice(gundam_printings)
    product = {
        'printing_id': pid,
        'game': 'GND',
        'condition': random.choice(['Near Mint', 'Lightly Played']),
        'language': 'en',
        'price': round(random.uniform(5.0, 100.0), 2),
        'quantity': random.randint(1, 5),
        'is_foil': random.choice([True, False]),
        'tcg_specific_attributes': {}
    }
    dummy_products.append(product)

# 4. Insertar en BD
try:
    res = supabase.table('products').insert(dummy_products).execute()
    print(f"Insertados {len(res.data)} productos en el inventario.")
except Exception as e:
    print(f"Error insertando: {e}")

# 5. Refrescar vista materializada por si acaso
try:
    # Intento invocar RPC
    supabase.rpc('refresh_all_catalog_data', {}).execute()
    print("Vistas materializadas refrescadas.")
except Exception as e:
    print(f"No se pudo refrescar vista (ignorar si no existe el rpc): {e}")

print("Generación de inventario dummy finalizada.")
