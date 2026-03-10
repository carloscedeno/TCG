import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def verify_prices():
    # Card Kingdom API v2
    url = "https://api.cardkingdom.com/api/v2/pricelist"
    
    print("Fetching full pricelist from CardKingdom...")
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching API: {response.status_code}")
        print(response.text)
        return

    json_data = response.json()
    
    # Try different possible keys for the card list
    cards = json_data.get('data') or json_data.get('pricelist')
    
    if cards is None:
        print(f"Error: Could not find card list in response. Keys found: {list(json_data.keys())}")
        return
    
    print(f"Found {len(cards)} items.")
    
    targets = [
        {"name": "Pandemonium", "edition_hint": "Exodus"},
        {"name": "Orcish Bowmasters", "edition_hint": ""},
        {"name": "827", "edition_hint": ""}
    ]
    
    with open("ck_price_verification.txt", "w", encoding="utf-8") as f:
        f.write(f"Total items: {len(cards)}\n\n")
        
        for target in targets:
            f.write(f"--- Results for: {target['name']} ({target['edition_hint']}) ---\n")
            found_count = 0
            for item in cards:
                # Search across all relevant fields
                name = str(item.get('name', '')).lower()
                edition = str(item.get('edition', '')).lower()
                variation = str(item.get('variation', '')).lower()
                sku = str(item.get('sku', '')).lower()
                
                name_match = target["name"].lower() in name
                edition_match = target["edition_hint"].lower() in edition if target["edition_hint"] else True
                
                # Special handle for "827" or other number-based searches
                if target["name"].isdigit():
                    if target["name"] in sku or target["name"] in variation or target["name"] in edition:
                        name_match = True

                if name_match and edition_match:
                    f.write(json.dumps(item, indent=2) + "\n")
                    found_count += 1
            
            f.write(f"Found {found_count} matches.\n\n")
            
    print(f"Done. Check ck_price_verification.txt")

if __name__ == "__main__":
    verify_prices()
