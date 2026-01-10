import requests
import json

BASE_URL = "http://localhost:8000/api/cards"

def test_search():
    print("--- TESTING API SEARCH ENDPOINTS ---")
    
    # Test 1: Search for "Spider-Man" (General Query)
    try:
        print("\n1. Searching for 'Spider-Man' (q=Spider-Man)...")
        resp = requests.get(f"{BASE_URL}?q=Spider-Man&limit=5")
        if resp.status_code == 200:
            data = resp.json()
            count = data.get('total_count', 0)
            cards = data.get('cards', [])
            print(f"   Success! Found {count} cards.")
            if cards:
                print(f"   First hit: {cards[0]['name']} ({cards[0]['set']})")
        else:
            print(f"   Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")

    # Test 2: Search by Set "Marvel's Spider-Man"
    try:
        print("\n2. Filtering by Set 'Marvel's Spider-Man'...")
        # Note: URL encoding might be handled by requests, but let's be safe
        resp = requests.get(f"{BASE_URL}", params={"set": "Marvel's Spider-Man", "limit": 5})
        if resp.status_code == 200:
            data = resp.json()
            count = data.get('total_count', 0)
            cards = data.get('cards', [])
            print(f"   Success! Found {count} cards in set.")
            if cards:
                print(f"   First hit: {cards[0]['name']}")
        else:
            print(f"   Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")

    # Test 3: Search for "Aang"
    try:
        print("\n3. Searching for 'Aang'...")
        resp = requests.get(f"{BASE_URL}?q=Aang&limit=5")
        if resp.status_code == 200:
            data = resp.json()
            count = data.get('total_count', 0)
            print(f"   Success! Found {count} cards.")
        else:
            print(f"   Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    test_search()
