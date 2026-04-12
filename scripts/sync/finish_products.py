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

def finish_products():
    prod_key = get_prod_key()
    headers = {"apikey": prod_key, "Authorization": f"Bearer {prod_key}"}
    dev_headers = {"apikey": DEV_KEY, "Authorization": f"Bearer {DEV_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}

    print("Fetching ALL products from Prod to resume...", flush=True)
    products = []
    offset = 0
    limit = 1000
    while True:
        r = requests.get(f"{PROD_URL}/rest/v1/products?select=*&offset={offset}&limit={limit}", headers=headers)
        data = r.json()
        if not data: break
        products.extend(data)
        if len(data) < limit: break
        offset += limit
    
    print(f"Total found in Prod: {len(products)}. Current in Dev is ~1600.", flush=True)
    
    # 2. Push only the remainder or just use merge-duplicates for all
    print("Pushing Products to Dev in small batches...", flush=True)
    batch_size = 200
    for i in range(0, len(products), batch_size):
        batch = products[i:i + batch_size]
        res = requests.post(f"{DEV_URL}/rest/v1/products", headers=dev_headers, json=batch)
        if res.status_code not in [200, 201, 204]:
            print(f"  Error pushing batch starting at {i}: {res.text}", flush=True)
        else:
            print(f"  Pushed {min(i + batch_size, len(products))} / {len(products)}", flush=True)

    print("\nFinish Products Complete!")

if __name__ == "__main__":
    finish_products()
