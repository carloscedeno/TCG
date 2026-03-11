"""
Search CK pricelist for Goblin Warchief Scourge foil and 
find its scryfall_id to update DB.
"""
import os, sys, json, psycopg2
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(str(PROJECT_ROOT / '.env'))
DATABASE_URL = os.getenv('DATABASE_URL')

cache_file = PROJECT_ROOT / "data" / "cache" / "ck_pricelist.json"
with open(cache_file, 'r', encoding='utf-8') as f:
    data = json.load(f)
cards = data.get('data', [])

# Search for Goblin Warchief foil (any edition)
print("=== Goblin Warchief foil entries in CK ===")
gw_foil = [c for c in cards if 'goblin warchief' in (c.get('name') or '').lower() 
           and str(c.get('is_foil')).lower() == 'true']
print(f"Foil count: {len(gw_foil)}")
for c in gw_foil:
    print(json.dumps(c, indent=2))

# Show nonfoil too for comparison
print("\n=== Goblin Warchief nonfoil entries ===")
gw_nf = [c for c in cards if 'goblin warchief' in (c.get('name') or '').lower() 
         and str(c.get('is_foil')).lower() == 'false']
print(f"Nonfoil count: {len(gw_nf)}")
for c in gw_nf:
    print(f"  id={c.get('id')} edition={c.get('edition')} price={c.get('price_retail')} scryfall_id={c.get('scryfall_id')}")

# Now check our DB: what scryfall_id does Goblin Warchief Scourge have?
print("\n=== DB: Goblin Warchief printing_id and scryfall_id ===")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute("""
    SELECT cp.printing_id, cp.scryfall_id, cp.finishes, s.set_code,
           cp.avg_market_price_usd, cp.avg_market_price_foil_usd
    FROM card_printings cp
    JOIN cards c ON c.card_id = cp.card_id
    JOIN sets s ON s.set_id = cp.set_id
    WHERE c.card_name ILIKE 'Goblin Warchief'
    ORDER BY s.set_code
""")
for r in cur.fetchall():
    print(r)
cur.close()
conn.close()
