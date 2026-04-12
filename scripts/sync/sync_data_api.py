import requests
import json
import os

# Config from .env and .env.dev
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU4OTI3NSwiZXhwIjoyMDUxMTY1Mjc1fQ.W5_D1U-X-E-X-E-X" # I need to get the real one from .env

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s"

# Tables to sync in order
TABLES = ["games", "sources", "conditions", "sets", "cards", "card_printings", "products"]

def sync_table(table):
    print(f"Syncing {table}...", flush=True)
    headers = {"apikey": PROD_KEY, "Authorization": f"Bearer {PROD_KEY}"}
    
    all_data = []
    offset = 0
    limit = 1000
    
    while True:
        print(f"  Fetching records {offset} to {offset + limit}...", flush=True)
        # Removed order clause for speed and to avoid missing columns
        r = requests.get(f"{PROD_URL}/rest/v1/{table}?select=*&offset={offset}&limit={limit}", headers=headers)
        if r.status_code != 200:
            print(f"  Error fetching {table}: {r.text}", flush=True)
            break
        
        data = r.json()
        if not data: break
        
        all_data.extend(data)
        if len(data) < limit: break
        offset += limit

    print(f"  Total records fetched: {len(all_data)}", flush=True)
    if not all_data: return

    dev_headers = {
        "apikey": DEV_KEY,
        "Authorization": f"Bearer {DEV_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    # Identify conflict column (usually game_code or card_id)
    # Using a simple heuristic or just relying on merge-duplicates
    
    batch_size = 200 # Smaller batches for stability
    for i in range(0, len(all_data), batch_size):
        batch = all_data[i:i + batch_size]
        res = requests.post(f"{DEV_URL}/rest/v1/{table}", headers=dev_headers, json=batch)
        if res.status_code not in [200, 201, 204]:
            print(f"  Error pushing batch to {table}: {res.text}", flush=True)
        else:
            print(f"  Pushed {min(i + batch_size, len(all_data))} / {len(all_data)}", flush=True)

if __name__ == "__main__":
    # Note: I'll need to read the real SERVICE_ROLE_KEY from .env first
    with open(".env", "r") as f:
        for line in f:
            if "SUPABASE_SERVICE_ROLE_KEY" in line:
                PROD_KEY = line.split("=")[1].strip().strip('"')
                break
    
    for t in TABLES:
        sync_table(t)
