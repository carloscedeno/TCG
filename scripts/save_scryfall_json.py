import requests
import json

def write_scryfall_json(set_code, collector_number):
    url = f"https://api.scryfall.com/cards/{set_code}/{collector_number}"
    print(f"Fetching: {url}")
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    
    filename = f"scryfall_{set_code}_{collector_number}.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved to {filename}")

if __name__ == "__main__":
    write_scryfall_json("ecl", "347")
    write_scryfall_json("ecl", "265")
