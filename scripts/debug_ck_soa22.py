"""
Debug: Find ALL entries for SOA collector #22 (Sleight of Hand) in the CK pricelist.
"""
import json, sys, io
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
CACHE_FILE = PROJECT_ROOT / "data" / "cache" / "ck_pricelist.json"

with open(CACHE_FILE, 'r', encoding='utf-8') as f:
    pricelist = json.load(f).get('data', [])

print("=== All CK entries whose SKU contains '0022' and edition is Strixhaven ===\n")
targets = []
for c in pricelist:
    sku = c.get('sku', '')
    edition = c.get('edition', '').lower()
    if '0022' in sku and ('strixhaven' in edition or 'mystical' in edition):
        targets.append(c)

for c in targets:
    print(f"SKU: {c.get('sku')}")
    print(f"  name:     {c.get('name')}")
    print(f"  edition:  {c.get('edition')}")
    print(f"  is_foil:  {c.get('is_foil')}")
    print(f"  price:    {c.get('price_retail')}")
    print(f"  scryfall: {c.get('scryfall_id')}")
    print()
