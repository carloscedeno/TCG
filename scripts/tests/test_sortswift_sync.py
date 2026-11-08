import requests
import json
import sys
sys.path.append('.')
sys.path.append('scripts/sync')
from common.db import get_supabase
from common.sortswift_client import SortSwiftClient

print("=== 1. VERIFYING SUPABASE DEV RECORDS ===")
sb = get_supabase()
res = sb.table("products").select("id, name, game, price, cost, stock, physical_location, sortswift_id, barcode").not_.is_("sortswift_id", "null").execute()
print(f"Total synced cards in Supabase DEV: {len(res.data)}")
for p in res.data:
    print(f"[{p['game']}] {p['name']}")
    print(f"   ID:       {p['id']}")
    print(f"   SortSwift:{p['sortswift_id']}")
    print(f"   Location: {p['physical_location']}")
    print(f"   Price:    ${p['price']} | Cost: ${p['cost']} | Stock: {p['stock']}")
    print(f"   Barcode:  {p['barcode']}")
    print('-'*50)

print("\n=== 2. VERIFYING SORTSWIFT API PERSISTENCE ===")
api_key = "ss_inv_sbx_e56e17c7ca1fe8dcc88650edcd0bc654f6a37803a64f6e6b54debdcc6d39c358"
client = SortSwiftClient(api_key=api_key)
cards = client.get_raw_cards().get("data", [])
for c in cards:
    print(f"SortSwift Card {c['id']}:")
    print(f"   ExternalId (Supabase UUID): {c.get('externalId')}")
    print(f"   Barcode:                    {c.get('barcode')}")
    print(f"   Qty:                        {c.get('quantity')}")
