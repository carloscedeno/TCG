import requests
import json
import os

# Config
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY"

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

TABLES = ["games", "sets", "cards", "card_printings", "products"]

def sync_table(table):
    print(f"\n>>> Syncing {table}...")
    headers = {"apikey": PROD_ANON_KEY, "Authorization": f"Bearer {PROD_ANON_KEY}"}
    dev_headers = {
        "apikey": DEV_SERVICE_KEY,
        "Authorization": f"Bearer {DEV_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates"
    }

    # Fetch
    all_data = []
    offset = 0
    limit = 1000
    while True:
        print(f"  Fetching {table} {offset} to {offset+limit}...")
        r = requests.get(f"{PROD_URL}/rest/v1/{table}?select=*&offset={offset}&limit={limit}", headers=headers)
        if r.status_code != 200:
            print(f"\n  Error fetching {table}: {r.status_code} {r.text}")
            break
        data = r.json()
        if not data: break
        all_data.extend(data)
        if len(data) < limit: break
        offset += limit
    
    print(f"  Total fetched: {len(all_data)}")
    if not all_data: return

    # Push
    batch_size = 100
    for i in range(0, len(all_data), batch_size):
        batch = all_data[i:i+batch_size]
        print(f"  Pushing {i} to {i+len(batch)}...")
        res = requests.post(f"{DEV_URL}/rest/v1/{table}", headers=dev_headers, json=batch)
        if i == 0:
            print(f"\n  First batch response for {table}: {res.status_code} {res.text[:200]}...")
        if res.status_code not in [200, 201, 204]:
            print(f"\n  Error pushing to {table}: {res.status_code} {res.text}")
            # Try individual if batch fails due to single record issue? 
            # No, keep it simple for now.
    print(f"\n  Done with {table}.")

if __name__ == "__main__":
    for t in TABLES:
        sync_table(t)
    
    print("\nRefreshing MV...")
    dev_headers = {
        "apikey": DEV_SERVICE_KEY,
        "Authorization": f"Bearer {DEV_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    # Trigger refresh via SQL if refresh_mv doesn't exist
    # Actually, I'll just use the RPC if it works now.
    r = requests.post(f"{DEV_URL}/rest/v1/rpc/refresh_mv", headers=dev_headers)
    print(f"Refresh RPC: {r.status_code}")
    
    print("\nAll Done!")
