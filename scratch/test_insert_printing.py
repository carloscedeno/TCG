import requests

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def test_insert_printing():
    headers = {
        "apikey": DEV_KEY,
        "Authorization": f"Bearer {DEV_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    # Need a valid UUID or similar if printing_id is UUID
    data = [{
        "printing_id": "00000000-0000-0000-0000-000000000001",
        "card_id": "00000000-0000-0000-0000-000000000001",
        "set_id": 1,
        "collector_number": "1",
        "rarity": "rare",
        "lang": "en"
    }]
    
    print("Trying to insert test printing...")
    r = requests.post(f"{DEV_URL}/rest/v1/card_printings", headers=headers, json=data)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    test_insert_printing()
