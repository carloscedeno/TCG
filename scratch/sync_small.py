import requests
import json

# Config
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY"
DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def sync_small():
    headers = {"apikey": PROD_ANON_KEY, "Authorization": f"Bearer {PROD_ANON_KEY}"}
    dev_headers = {"apikey": DEV_KEY, "Authorization": f"Bearer {DEV_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}

    print("Fetching 100 products from Prod...")
    r = requests.get(f"{PROD_URL}/rest/v1/products?select=*&limit=100", headers=headers)
    products = r.json()
    print(f"Fetched {len(products)} products.")

    printing_ids = list(set([p['printing_id'] for p in products if p.get('printing_id')]))
    print(f"Fetching {len(printing_ids)} printings...")
    ids_str = ",".join([str(id) for id in printing_ids])
    r = requests.get(f"{PROD_URL}/rest/v1/card_printings?printing_id=in.({ids_str})", headers=headers)
    printings = r.json()

    card_ids = list(set([p['card_id'] for p in printings if p.get('card_id')]))
    set_ids = list(set([p['set_id'] for p in printings if p.get('set_id')]))

    print(f"Fetching {len(card_ids)} cards...")
    ids_str = ",".join([str(id) for id in card_ids])
    r = requests.get(f"{PROD_URL}/rest/v1/cards?card_id=in.({ids_str})", headers=headers)
    cards = r.json()

    print(f"Fetching {len(set_ids)} sets...")
    ids_str = ",".join([str(id) for id in set_ids])
    r = requests.get(f"{PROD_URL}/rest/v1/sets?set_id=in.({ids_str})", headers=headers)
    sets = r.json()

    print("Pushing to Dev...")
    r = requests.post(f"{DEV_URL}/rest/v1/sets", headers=dev_headers, json=sets)
    print(f"  Sets: {r.status_code} {r.text}")
    r = requests.post(f"{DEV_URL}/rest/v1/cards", headers=dev_headers, json=cards)
    print(f"  Cards: {r.status_code} {r.text}")
    r = requests.post(f"{DEV_URL}/rest/v1/card_printings", headers=dev_headers, json=printings)
    print(f"  Printings: {r.status_code} {r.text}")
    r = requests.post(f"{DEV_URL}/rest/v1/products", headers=dev_headers, json=products)
    print(f"  Products: {r.status_code} {r.text}")
    
    print("Refreshing MV...")
    r = requests.post(f"{DEV_URL}/rest/v1/rpc/refresh_mv", headers=dev_headers)
    print(f"  Refresh: {r.status_code} {r.text}")
    
    print("Sync Complete!")

if __name__ == "__main__":
    sync_small()
