import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def verify_all_riders_variants():
    # Card Kingdom API v2
    url = "https://api.cardkingdom.com/api/v2/pricelist"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        cards = data.get('data') or data.get('pricelist', [])
        
        found = []
        for card in cards:
            name = card.get('name', '').lower()
            sku = card.get('sku', '')
            if "riders of the mark" in name:
                found.append(card)
        
        if found:
            print(f"Found {len(found)} Riders of the Mark items:")
            for f in found:
                print(f"Name: {f.get('name')}, SKU: {f.get('sku')}, Price: ${f.get('price_retail')}, Edition: {f.get('edition')}")
        else:
            print("No Riders of the Mark found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_all_riders_variants()
