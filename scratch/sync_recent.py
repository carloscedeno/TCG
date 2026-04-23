import requests

# Config
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY"
DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def sync_recent():
    headers = {"apikey": PROD_ANON_KEY, "Authorization": f"Bearer {PROD_ANON_KEY}"}
    dev_headers = {
        "apikey": DEV_SERVICE_KEY,
        "Authorization": f"Bearer {DEV_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates"
    }

    # soc (Secrets of Strixhaven Commander) and sos (Secrets of Strixhaven)
    set_codes = ["soc", "sos"]
    print(f"Syncing sets: {set_codes}")
    
    r = requests.get(f"{PROD_URL}/rest/v1/sets?set_code=in.({','.join(set_codes)})", headers=headers)
    sets = r.json()
    requests.post(f"{DEV_URL}/rest/v1/sets", headers=dev_headers, json=sets)
    
    set_ids = [s['set_id'] for s in sets]
    ids_str = ",".join([str(id) for id in set_ids])
    
    print("Fetching printings...")
    r = requests.get(f"{PROD_URL}/rest/v1/card_printings?set_id=in.({ids_str})", headers=headers)
    printings = r.json()
    
    card_ids = list(set([p['card_id'] for p in printings]))
    printing_ids = list(set([p['printing_id'] for p in printings]))
    
    print(f"Syncing {len(card_ids)} cards...")
    for i in range(0, len(card_ids), 200):
        batch = card_ids[i:i+200]
        b_str = ",".join([str(id) for id in batch])
        r = requests.get(f"{PROD_URL}/rest/v1/cards?card_id=in.({b_str})", headers=headers)
        requests.post(f"{DEV_URL}/rest/v1/cards", headers=dev_headers, json=r.json())

    print(f"Syncing {len(printings)} printings...")
    for i in range(0, len(printings), 200):
        requests.post(f"{DEV_URL}/rest/v1/card_printings", headers=dev_headers, json=printings[i:i+200])

    print("Fetching products...")
    # Fetch products for these printing_ids
    products = []
    for i in range(0, len(printing_ids), 200):
        batch = printing_ids[i:i+200]
        b_str = ",".join([f"\"{id}\"" for id in batch])
        r = requests.get(f"{PROD_URL}/rest/v1/products?printing_id=in.({b_str})", headers=headers)
        products.extend(r.json())
        
    print(f"Syncing {len(products)} products...")
    for i in range(0, len(products), 200):
        batch = products[i:i+200]
        r = requests.post(f"{DEV_URL}/rest/v1/products", headers=dev_headers, json=batch)
        if i == 0:
            print(f"  Batch {i}: Status {r.status_code}, Response {r.json()[:2]}")
        else:
            print(f"  Batch {i}: Status {r.status_code}")
        
    print("Sync Complete!")

if __name__ == "__main__":
    sync_recent()
