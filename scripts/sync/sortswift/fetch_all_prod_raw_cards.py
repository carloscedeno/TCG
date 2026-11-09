import os
import json
import requests
from pathlib import Path

api_key = os.getenv("SORTSWIFT_PROD_API_KEY") or os.getenv("SORTSWIFT_API_KEY") or "ss_inv_fa551970f693f49c03d8b0120d35e6b314ce980a6a31eda3b6b683520efec738"
headers = {
    "X-API-Key": api_key,
    "Content-Type": "application/json",
    "Accept": "application/json"
}

all_cards = []
cursor = None

print("Fetching all RAW cards from SortSwift Production...")
while True:
    url = "https://inventory-api.sortswift.com/api/inventory/api-key/raw-cards?limit=100"
    if cursor:
        url += f"&cursor={cursor}"
    
    r = requests.get(url, headers=headers, timeout=20)
    if r.status_code != 200:
        print(f"Error fetching from SortSwift: {r.status_code} - {r.text}")
        break
        
    res = r.json()
    items = res.get("data", [])
    if not items:
        break
        
    all_cards.extend(items)
    print(f"Fetched {len(all_cards)} cards so far...")
    
    cursor = res.get("pagination", {}).get("nextCursor")
    if not cursor:
        break

print(f"\nTotal SortSwift PROD cards fetched: {len(all_cards)}")

out_path = Path("scripts/sync/sortswift/prod_sortswift_cards.json")
out_path.write_text(json.dumps(all_cards, indent=2), encoding="utf-8")
print(f"Saved to {out_path}!")
