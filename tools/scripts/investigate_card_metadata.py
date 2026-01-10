import requests
import json

BASE_URL = "http://localhost:8000/api/cards"

def investigate_card():
    print("--- INVESTIGATING CARD METADATA ---")
    card_name = "Friendly Neighborhood"
    
    try:
        resp = requests.get(f"{BASE_URL}?q={card_name}")
        if resp.status_code == 200:
            data = resp.json()
            cards = data.get('cards', [])
            print(f"Found {len(cards)} cards for '{card_name}'")
            for c in cards:
                print(f"Name: {c['name']}")
                print(f"Set: '{c['set']}'")
                print(f"Set Char Codes: {[ord(x) for x in c['set']]}")
        else:
            print(f"Error: {resp.status_code}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    investigate_card()
