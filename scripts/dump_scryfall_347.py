import requests
import json

def dump_scryfall_347():
    url = "https://api.scryfall.com/cards/ecl/347"
    print(f"Fetching: {url}")
    resp = requests.get(url)
    if resp.status_code != 200:
        print(f"FAILED: {resp.status_code}")
        # Try search instead
        url = "https://api.scryfall.com/cards/search?q=e:ecl+num:347"
        resp = requests.get(url)
        print(f"Search status: {resp.status_code}")
        
    data = resp.json()
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    dump_scryfall_347()
