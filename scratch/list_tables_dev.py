import requests
import json

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def list_tables():
    headers = {"apikey": DEV_KEY, "Authorization": f"Bearer {DEV_KEY}"}
    r = requests.get(f"{DEV_URL}/rest/v1/", headers=headers)
    if r.status_code == 200:
        spec = r.json()
        paths = spec.get('paths', {})
        tables = [p.replace('/', '') for p in paths.keys() if not p.startswith('/rpc/')]
        print("Tables in DEV:")
        for t in sorted(tables):
            print(f"  - {t}")
    else:
        print(f"Error: {r.status_code} {r.text}")

if __name__ == "__main__":
    list_tables()
