"""
DEBUG: See what variation/collector number format CK uses for Strixhaven entries
"""
import json, sys, io
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
CACHE_FILE = PROJECT_ROOT / "data" / "cache" / "ck_pricelist.json"

with open(CACHE_FILE, 'r', encoding='utf-8') as f:
    pricelist = json.load(f).get('data', [])

# Find all SOA entries
soa_entries = [c for c in pricelist if 'secrets of strixhaven mystical archive' == c.get('edition','').lower().strip()]
print(f"SOA entries in CK: {len(soa_entries)}")
print("\nFirst 5 entries:")
for c in soa_entries[:5]:
    print(f"  name={c.get('name')} | edition={c.get('edition')} | variation={c.get('variation')} | sku={c.get('sku')} | is_foil={c.get('is_foil')} | price={c.get('price_retail')}")

# Also check SOS
sos_entries = [c for c in pricelist if 'secrets of strixhaven' == c.get('edition','').lower().strip()]
print(f"\nSOS entries in CK: {len(sos_entries)}")
print("First 5 entries:")
for c in sos_entries[:5]:
    print(f"  name={c.get('name')} | edition={c.get('edition')} | variation={c.get('variation')} | sku={c.get('sku')} | is_foil={c.get('is_foil')} | price={c.get('price_retail')}")

# Check strixhaven tokens
tsos_entries = [c for c in pricelist if 'strixhaven' in c.get('edition','').lower() and 'token' in c.get('edition','').lower()]
print(f"\nTSOS entries in CK: {len(tsos_entries)}")

# Check all keys available
if soa_entries:
    print(f"\nAll keys in a CK soa entry:")
    for k, v in soa_entries[0].items():
        print(f"  {k}: {v}")
