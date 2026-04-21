import requests
import json
import time

# Config
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY"
DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s"

# Headers
PROD_HEADERS = {"apikey": PROD_ANON_KEY, "Authorization": f"Bearer {PROD_ANON_KEY}"}
DEV_HEADERS = {
    "apikey": DEV_KEY, 
    "Authorization": f"Bearer {DEV_KEY}", 
    "Content-Type": "application/json", 
    "Prefer": "resolution=merge-duplicates"
}

def sync_table(table_name, select="*"):
    print(f"\n[SYNC] Starting {table_name}...", flush=True)
    offset = 0
    limit = 200 # Smaller limit for more frequent updates
    total_synced = 0
    
    while True:
        try:
            # print(f"  [GET] {table_name} offset {offset}...", flush=True)
            r = requests.get(f"{PROD_URL}/rest/v1/{table_name}?select={select}&offset={offset}&limit={limit}", headers=PROD_HEADERS, timeout=30)
            if r.status_code != 200:
                print(f"  [ERROR] Fetching from Prod: {r.status_code} - {r.text}", flush=True)
                break
            
            data = r.json()
            if not data:
                break
            
            # print(f"  [POST] {table_name} chunk of {len(data)}...", flush=True)
            res = requests.post(f"{DEV_URL}/rest/v1/{table_name}", headers=DEV_HEADERS, json=data, timeout=30)
            if res.status_code not in [200, 201, 204]:
                print(f"  [ERROR] Pushing to Dev: {res.status_code} - {res.text}", flush=True)
            
            total_synced += len(data)
            print(f"  [PROGRESS] Synced {total_synced} records...", flush=True)
            
            if len(data) < limit:
                break
            
            offset += limit
            # time.sleep(0.05) 
        except Exception as e:
            print(f"  [EXCEPTION] sync of {table_name}: {e}", flush=True)
            break
            
    print(f"[SYNC] Completed {table_name}. Total: {total_synced}", flush=True)

if __name__ == "__main__":
    start_time = time.time()
    print("Starting Robust Inventory Sync (Rest API)", flush=True)
    
    # Order matters for foreign keys
    tables = [
        "games", 
        "sources", 
        "conditions", 
        "sets", 
        "cards", 
        "card_printings", 
        "products"
    ]
    
    for table in tables:
        sync_table(table)
        
    duration = time.time() - start_time
    print(f"\nGlobal Inventory Sync Complete! Duration: {duration:.2f}s", flush=True)
