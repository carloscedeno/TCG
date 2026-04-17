import requests

def verify_sets():
    sets_to_check = ["tsos", "spg"]
    for scode in sets_to_check:
        print(f"\nChecking set: {scode}")
        # Search for cards in this set
        url = f"https://api.scryfall.com/cards/search?q=e%3A{scode}&unique=prints"
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            print(f"  Found {data['total_cards']} cards.")
        else:
            # Try with include_extras for tokens
            url = f"https://api.scryfall.com/cards/search?q=e%3A{scode}&unique=prints&include_extras=true"
            resp = requests.get(url)
            if resp.status_code == 200:
                data = resp.json()
                print(f"  Found {data['total_cards']} cards (with include_extras).")
            else:
                print(f"  Set '{scode}' not found or no cards found.")

if __name__ == "__main__":
    verify_sets()
