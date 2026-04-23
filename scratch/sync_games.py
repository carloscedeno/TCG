import requests
import json

# Config
PROD_URL = "https://sxuotvogwvmxuvwbsscv.supabase.co"
PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY"
DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def sync_games():
    headers = {"apikey": PROD_ANON_KEY, "Authorization": f"Bearer {PROD_ANON_KEY}"}
    dev_headers = {"apikey": DEV_KEY, "Authorization": f"Bearer {DEV_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}

    print("Fetching games from Prod...")
    r = requests.get(f"{PROD_URL}/rest/v1/games?select=*", headers=headers)
    games = r.json()
    print(f"Fetched {len(games)} games.")

    print("Pushing to Dev...")
    requests.post(f"{DEV_URL}/rest/v1/games", headers=dev_headers, json=games)
    print("Sync Complete!")

if __name__ == "__main__":
    sync_games()
