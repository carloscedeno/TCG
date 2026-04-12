import requests
import json
import os

# Config
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s"

def get_prod_key():
    with open(".env", "r") as f:
        for line in f:
            if "SUPABASE_SERVICE_ROLE_KEY" in line:
                return line.split("=")[1].strip().strip('"')

def sync_inventory_only():
    prod_key = get_prod_key()
    headers = {"apikey": prod_key, "Authorization": f"Bearer {prod_key}"}
    dev_headers = {"apikey": DEV_KEY, "Authorization": f"Bearer {DEV_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}

    # 1. Fetch ALL products first
    print("Fetching active products from Prod...", flush=True)
    products = []
    offset = 0
    limit = 1000
    while True:
        print(f"  Fetching products {offset} to {offset+limit}...", flush=True)
        r = requests.get(f"{PROD_URL}/rest/v1/products?select=*&offset={offset}&limit={limit}", headers=headers)
        data = r.json()
        if not data: break
        products.extend(data)
        if len(data) < limit: break
        offset += limit
    
    print(f"  Found {len(products)} products.")

    # 2. Extract IDs
    printing_ids = list(set([p['printing_id'] for p in products if p.get('printing_id')]))
    
    # 3. Fetch Printings for those products
    print(f"Fetching {len(printing_ids)} relevant printings...")
    relevant_printings = []
    # Batch the ID filter because URL limit
    batch_size = 100
    for i in range(0, len(printing_ids), batch_size):
        ids_str = ",".join([str(id) for id in printing_ids[i:i+batch_size]])
        r = requests.get(f"{PROD_URL}/rest/v1/card_printings?printing_id=in.({ids_str})", headers=headers)
        relevant_printings.extend(r.json())
    
    card_ids = list(set([p['card_id'] for p in relevant_printings if p.get('card_id')]))
    set_ids = list(set([p['set_id'] for p in relevant_printings if p.get('set_id')]))

    # 4. Fetch relevant Cards
    print(f"Fetching {len(card_ids)} relevant cards...")
    relevant_cards = []
    for i in range(0, len(card_ids), batch_size):
        ids_str = ",".join([str(id) for id in card_ids[i:i+batch_size]])
        r = requests.get(f"{PROD_URL}/rest/v1/cards?card_id=in.({ids_str})", headers=headers)
        relevant_cards.extend(r.json())

    # 5. Fetch relevant Sets
    print(f"Fetching {len(set_ids)} relevant sets...")
    relevant_sets = []
    for i in range(0, len(set_ids), batch_size):
        ids_str = ",".join([str(id) for id in set_ids[i:i+batch_size]])
        r = requests.get(f"{PROD_URL}/rest/v1/sets?set_id=in.({ids_str})", headers=headers)
        relevant_sets.extend(r.json())

    # --- PUSH TO DEV ---
    print("\nPushing to Dev...")
    # Order: Games (already synced manually or via prev), Sets, Cards, Printings, Products
    
    print("Pushing Sets...")
    requests.post(f"{DEV_URL}/rest/v1/sets", headers=dev_headers, json=relevant_sets)
    
    print("Pushing Cards...")
    for i in range(0, len(relevant_cards), 200):
        requests.post(f"{DEV_URL}/rest/v1/cards", headers=dev_headers, json=relevant_cards[i:i+200])
        print(f"  {min(i+200, len(relevant_cards))}/{len(relevant_cards)}")

    print("Pushing Printings...")
    for i in range(0, len(relevant_printings), 200):
        requests.post(f"{DEV_URL}/rest/v1/card_printings", headers=dev_headers, json=relevant_printings[i:i+200])
        print(f"  {min(i+200, len(relevant_printings))}/{len(relevant_printings)}")

    print("Pushing Products...")
    for i in range(0, len(products), 200):
        requests.post(f"{DEV_URL}/rest/v1/products", headers=dev_headers, json=products[i:i+200])
        print(f"  {min(i+200, len(products))}/{len(products)}")

    print("\nSync Complete!")

if __name__ == "__main__":
    sync_inventory_only()
