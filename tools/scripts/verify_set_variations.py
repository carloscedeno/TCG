import requests

BASE_URL = "http://localhost:8000/api/cards"

def test_variations():
    variations = [
        "Marvel's Spider-Man",
        "Marvel''s Spider-Man",
        "Marvel\\'s Spider-Man",
        'Marvel%27s Spider-Man' # Raw encoded
    ]
    
    print("--- TESTING SET NAME VARIATIONS ---")
    for v in variations:
        try:
            print(f"Testing: {v}")
            # requests handles encoding, so we pass raw string mostly
            resp = requests.get(BASE_URL, params={'set': v, 'limit': 1})
            if resp.status_code == 200:
                count = resp.json().get('total_count', 0)
                print(f"  -> Count: {count}")
            else:
                print(f"  -> Error: {resp.status_code}")
        except Exception as e:
            print(f"  -> Exception: {e}")

if __name__ == "__main__":
    test_variations()
