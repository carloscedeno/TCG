import requests

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def test_insert():
    headers = {
        "apikey": DEV_KEY,
        "Authorization": f"Bearer {DEV_KEY}",
        "Content-Type": "application/json"
    }
    data = [{"name": "Test Product", "price_usd": 10.0, "stock": 1, "game": "MTG"}]
    
    print("Trying to insert test product...")
    r = requests.post(f"{DEV_URL}/rest/v1/products", headers=headers, json=data)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    test_insert()
