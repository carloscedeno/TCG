import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

def verify_all_riders_variants():
    # Card Kingdom API v2
    url = "https://api.cardkingdom.com/api/v2/pricelist"
    
    print("Fetching full pricelist from CardKingdom API...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # The key is often 'data' or 'pricelist'
        cards = data.get('data') or data.get('pricelist', [])
        print(f"Total items in pricelist: {len(cards)}")
        
        found = []
        for card in cards:
            name = card.get('name', '').lower()
            sku = card.get('sku', '')
            if "riders of the mark" in name or "827" in sku or "832" in sku:
                found.append(card)
        
        if found:
            print(f"\nFound {len(found)} relevant items:")
            for f in found:
                print(f"Name: {f.get('name')}, SKU: {f.get('sku')}, Price: ${f.get('price_retail')}, Edition: {f.get('edition')}")
        else:
            print("\nNo matching items found.")
            
    except Exception as e:
        print(f"Error fetching/parsing API: {e}")

if __name__ == "__main__":
    verify_all_riders_variants()
