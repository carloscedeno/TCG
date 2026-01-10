import requests
import json
import urllib.parse

BASE_URL = "http://localhost:8000/api/cards"

def test_connectivity():
    print("--- DIAGNOSING API ---")
    
    # 1. Basic Health Query
    try:
        print("\n1. Basic Query (No filters)...")
        resp = requests.get(f"{BASE_URL}?limit=1")
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   Count: {data.get('total_count')}")
            cards = data.get('cards', [])
            if cards:
                print(f"   Sample: {cards[0]['name']} ({cards[0].get('set')})")
        else:
            print(f"   Error: {resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")

    # 2. Set Filter with Apostrophe
    set_name = "Marvel's Spider-Man"
    print(f"\n2. Filter by Set: {set_name}")
    try:
        # Manually encoding to be sure, though params= usually works
        params = {'set': set_name, 'limit': 1}
        resp = requests.get(BASE_URL, params=params)
        print(f"   URL Used: {resp.url}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"   Count: {data.get('total_count')}")
        else:
            print(f"   Error: {resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")

    # 3. Avatar Check
    set_name_2 = "Avatar: The Last Airbender"
    print(f"\n3. Filter by Set: {set_name_2}")
    try:
        params = {'set': set_name_2, 'limit': 1}
        resp = requests.get(BASE_URL, params=params)
        if resp.status_code == 200:
            data = resp.json()
            print(f"   Count: {data.get('total_count')}")
        else:
            print(f"   Error: {resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    test_connectivity()
