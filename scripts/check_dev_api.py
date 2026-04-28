import requests
import json

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s"

def check_dev_data():
    headers = {"apikey": DEV_KEY, "Authorization": f"Bearer {DEV_KEY}"}
    
    # Check games
    print("--- Games in DEV ---")
    r = requests.get(f"{DEV_URL}/rest/v1/games?select=*", headers=headers)
    print(r.text)
    
    # Check sets for Pokemon
    print("\n--- Pokemon Sets count in DEV (game_id=10) ---")
    r = requests.get(f"{DEV_URL}/rest/v1/sets?game_id=eq.10&select=*", headers={**headers, "Prefer": "count=exact"})
    print(f"Status: {r.status_code}")
    print(f"Total: {r.headers.get('Content-Range')}")
    
    # Check products for Pokemon
    print("\n--- Pokemon Products count in DEV ---")
    r = requests.get(f"{DEV_URL}/rest/v1/products?game=eq.POKEMON&select=*", headers={**headers, "Prefer": "count=exact"})
    print(f"Status: {r.status_code}")
    print(f"Total: {r.headers.get('Content-Range')}")

if __name__ == "__main__":
    check_dev_data()
