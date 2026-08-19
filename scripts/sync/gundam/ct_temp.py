import httpx
import os
from dotenv import load_dotenv

load_dotenv('.env')
token = os.environ.get('CARDTRADER_API_KEY')
headers = {'Authorization': f'Bearer {token}'}
client = httpx.Client(headers=headers, timeout=30.0)

exp_req = client.get('https://api.cardtrader.com/api/v2/expansions')
expansions = exp_req.json()

target_id = None
for exp in expansions:
    if exp['game_id'] == 1 and 'Dominaria United' in exp['name'] and 'Collector' not in exp['name'] and 'Promo' not in exp['name']:
        target_id = exp['id']
        print(f"Exp: {exp['name']} (ID: {target_id})")
        break

if target_id:
    bp_req = client.get(f'https://api.cardtrader.com/api/v2/blueprints/export?expansion_id={target_id}')
    bps = bp_req.json()
    sheoldred_id = next((b['id'] for b in bps if 'Sheoldred, the Apocalypse' in b['name']), None)
    print(f'Sheoldred ID: {sheoldred_id}')
    
    if sheoldred_id:
        prods_req = client.get(f'https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id={sheoldred_id}')
        prods_data = prods_req.json()
        
        prices_en = []
        for k, v in prods_data.items():
            if isinstance(v, list):
                for p in v:
                    if p.get('properties_hash', {}).get('language') == 'en' and p.get('properties_hash', {}).get('condition') in ['Near Mint', 'Lightly Played']:
                        prices_en.append(p['price']['cents'] / 100.0)
        
        if prices_en:
            prices_en.sort()
            print(f"Precio Base Mas Barato (EN, NM/LP): ${prices_en[0]:.2f}")
            market = sum(prices_en[:5]) / min(5, len(prices_en))
            print(f"Precio Promedio (Primeros 5): ${market:.2f}")
        else:
            print("No english products.")
