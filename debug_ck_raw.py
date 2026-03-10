import httpx
import json

def debug_ck_raw():
    url = "https://api.cardkingdom.com/api/v2/pricelist"
    resp = httpx.get(url)
    data = resp.json()
    
    # Correct key is 'data'
    pricelist = data.get('data', [])
    
    print(f"--- Searching for ANY item with 827 or Riders in CK API ({len(pricelist)} items) ---")
    found = False
    for item in pricelist:
        name = item.get('name', '')
        sku = item.get('u_sku', '')
        if '827' in sku or 'Riders of the Mark' in name:
            found = True
            print(f"SKU: {sku} | Name: {name} | Price: {item.get('price_retail')} | Edition: {item.get('edition')} | Foil: {item.get('is_foil')}")
    
    if not found:
        print("No items found.")

if __name__ == "__main__":
    debug_ck_raw()
