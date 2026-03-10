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
        return

    json_data = response.json()
    cards = json_data.get('data') or json_data.get('pricelist')
    
    if cards is None:
        print(f"Error: Could not find card list in response.")
        return
    
    target_name = "Riders of the Mark"
    
    with open("ck_riders_verification.txt", "w", encoding="utf-8") as f:
        f.write(f"Results for: {target_name}\n\n")
        found_count = 0
        for item in cards:
            if target_name.lower() in str(item.get('name', '')).lower():
                f.write(json.dumps(item, indent=2) + "\n\n")
                found_count += 1
        
        f.write(f"Found {found_count} matches.\n")
            
    print(f"Done. Check ck_riders_verification.txt")

if __name__ == "__main__":
    verify_prices()
