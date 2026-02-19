import requests
import json

def dump_scryfall_265():
    url = "https://api.scryfall.com/cards/ecl/265"
    print(f"Fetching: {url}")
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    dump_scryfall_265()
