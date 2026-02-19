import requests
import json

def investigate_skipped_structure():
    url = "https://api.scryfall.com/cards/search?q=e:ecl+num:347&unique=prints"
    print(f"Checking Scryfall Search: {url}")
    
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    cards = data.get('data', [])
    
    if cards:
        c = cards[0]
        print("Card found in search!")
        print(f"Root keys: {list(c.keys())}")
        if 'card_faces' in c:
            print("Card has faces!")
            for idx, face in enumerate(c['card_faces']):
                print(f"Face {idx} keys: {list(face.keys())}")
                if 'oracle_id' in face:
                    print(f"Face {idx} HAS oracle_id: {face['oracle_id']}")
        
        # Print the whole thing for debugging
        print(json.dumps(c, indent=2))
    else:
        print("Card not found in search!")

if __name__ == "__main__":
    investigate_skipped_structure()
