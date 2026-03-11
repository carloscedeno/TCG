"""
Get full details of printing 66864a4b and check all_versions for Goblin Warchief.
"""
import os, sys, psycopg2, json
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(str(PROJECT_ROOT / '.env'))
DATABASE_URL = os.getenv('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

TARGET = '66864a4b-8924-40ef-a337-15b12413a158'

print(f"=== Printing {TARGET} ===")
cur.execute("""
    SELECT cp.printing_id, cp.finishes, cp.is_foil, cp.is_nonfoil,
           cp.avg_market_price_usd, cp.avg_market_price_foil_usd, cp.foil_price, cp.non_foil_price,
           s.set_code, c.card_name, cp.prices
    FROM card_printings cp
    JOIN cards c ON c.card_id = cp.card_id
    JOIN sets s ON s.set_id = cp.set_id
    WHERE cp.printing_id = %s
""", (TARGET,))
rows = cur.fetchall()
cols = [d[0] for d in cur.description]
for row in rows:
    d = dict(zip(cols, row))
    for k, v in d.items():
        print(f"  {k}: {v}")

# get products for this printing
print("\n=== Products ===")
cur.execute("SELECT id, price, stock, finish FROM products WHERE printing_id = %s", (TARGET,))
for r in cur.fetchall():
    print(r)

# Check what all_versions the Supabase fetchCardDetails would build
# by looking at what all_versions look like in card_printings query
print("\n=== All SCG Goblin Warchief printings ===")
cur.execute("""
    SELECT cp.printing_id, cp.finishes, cp.is_foil, cp.is_nonfoil,
           cp.avg_market_price_usd, cp.avg_market_price_foil_usd
    FROM card_printings cp
    JOIN cards c ON c.card_id = cp.card_id
    JOIN sets s ON s.set_id = cp.set_id
    WHERE c.card_name ILIKE 'Goblin Warchief'
    AND s.set_code ILIKE 'scg'
""")
rows = cur.fetchall()
cols = [d[0] for d in cur.description]
print(f"Found {len(rows)} printings")
for row in rows:
    print(dict(zip(cols, row)))

cur.close()
conn.close()
print("\nDone.")
