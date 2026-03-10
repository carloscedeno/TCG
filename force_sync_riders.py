import os
import json
import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def force_sync_riders_all():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # 1. Get current CK price from API
    api_url = "https://api.cardkingdom.com/api/v2/pricelist"
    print("Fetching CK API...")
    resp = requests.get(api_url)
    data = resp.json()
    cards = data.get('data') or data.get('pricelist')
    
    # Map SKUs to prices
    sku_prices = {}
    for item in cards:
        sku = item.get('sku')
        if sku in ['LTR-0827', 'LTR-0832']:
            sku_prices[sku] = float(item.get('price_retail', 0))
            
    print(f"Prices from API: {sku_prices}")
    
    # 2. Hardcoded target printing_ids from debug
    targets = [
        {'id': 'de77686e-c4c1-4d38-a05c-03eb7363fc0b', 'sku': 'LTR-0827'},
        {'id': 'e4b35111-2c74-4dda-b156-d1bf9f3c2947', 'sku': 'LTR-0832'}
    ]
    
    for target in targets:
        printing_id = target['id']
        sku = target['sku']
        new_price = sku_prices.get(sku)
        
        if new_price is None:
            print(f"Skipping {sku}, not found in API.")
            continue
            
        print(f"Updating {sku} ({printing_id}) to ${new_price}...")
        
        # Update card_printings
        cur.execute("""
            UPDATE card_printings 
            SET avg_market_price_usd = %s, updated_at = NOW() 
            WHERE printing_id = %s
        """, (new_price, printing_id))
        
        # Update products
        cur.execute("UPDATE products SET price = %s, updated_at = NOW() WHERE printing_id = %s", (new_price, printing_id))
        
        # Insert history
        cur.execute("""
            INSERT INTO price_history 
            (printing_id, price_usd, source_id, condition_id, timestamp) 
            VALUES (%s, %s, 17, 1, NOW())
        """, (printing_id, new_price))
    
    conn.commit()
    print("Sync complete.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    force_sync_riders_all()
