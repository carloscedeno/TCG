"""
Fix CK foil prices: 
- Match CK foil scryfall_ids against DB printings (both by scryfall_id AND by edition+name fallback)
- Update avg_market_price_foil_usd for all matched printings
- Insert into price_history

This is a one-time fix script that bridges the scryfall_id mismatch between
CK foil items and our DB nonfoil printings.
"""
import os, sys, json, psycopg2
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone

PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(str(PROJECT_ROOT / '.env'))
DATABASE_URL = os.getenv('DATABASE_URL')
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

cache_file = PROJECT_ROOT / "data" / "cache" / "ck_pricelist.json"
with open(cache_file, 'r', encoding='utf-8') as f:
    data = json.load(f)
cards = data.get('data', [])

# Get all FOIL items from CK pricelist
foil_items = [c for c in cards if str(c.get('is_foil')).lower() == 'true']
print(f"Total foil items in CK pricelist: {len(foil_items)}")

# Build lookup by scryfall_id
foil_by_scryfall = {}
for c in foil_items:
    sid = c.get('scryfall_id')
    if sid:
        foil_by_scryfall[sid] = c

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get all printings with their scryfall_ids
cur.execute("""
    SELECT cp.printing_id, cp.scryfall_id, c.card_name, s.set_name,
           cp.avg_market_price_foil_usd
    FROM card_printings cp
    JOIN cards c ON c.card_id = cp.card_id
    JOIN sets s ON s.set_id = cp.set_id
    WHERE cp.scryfall_id IS NOT NULL
""")
db_printings = cur.fetchall()  # (printing_id, scryfall_id, card_name, set_name, current_foil_price)
print(f"DB printings with scryfall_id: {len(db_printings)}")

# Build DB lookup by scryfall_id AND by (set_name.lower, card_name.lower)
db_by_scryfall = {}
db_by_name_edition = {}
for p in db_printings:
    pid, sid, cname, sname, current_fp = p
    db_by_scryfall[sid] = p
    key = (sname.lower().strip(), cname.lower().strip())
    if key not in db_by_name_edition:
        db_by_name_edition[key] = []
    db_by_name_edition[key].append(p)

# Now match foil CK items to DB printings
updates = []  # (printing_id, foil_price)
matched_by_scryfall = 0
matched_by_name = 0
unmatched = 0

for foil in foil_items:
    sid = foil.get('scryfall_id')
    price = float(foil.get('price_retail', 0) or 0)
    if price <= 0:
        continue
    
    matched_printing = None
    
    # 1. Direct scryfall_id match
    if sid and sid in db_by_scryfall:
        matched_printing = db_by_scryfall[sid]
        matched_by_scryfall += 1
    else:
        # 2. Fallback: edition + card name match
        edition = (foil.get('edition') or '').lower().strip()
        name = (foil.get('name') or '').lower().strip()
        key = (edition, name)
        candidates = db_by_name_edition.get(key, [])
        if candidates:
            # Prefer the one without foil price already set, or the first one
            no_fp = [c for c in candidates if c[4] is None]
            matched_printing = no_fp[0] if no_fp else candidates[0]
            matched_by_name += 1
    
    if matched_printing:
        updates.append((matched_printing[0], price))
    else:
        unmatched += 1

print(f"\nMatched by scryfall_id: {matched_by_scryfall}")
print(f"Matched by edition+name: {matched_by_name}")
print(f"Unmatched: {unmatched}")
print(f"Total updates to apply: {len(updates)}")

# Apply updates in batches
print("\nApplying avg_market_price_foil_usd updates...")
updated = 0
CK_SOURCE_ID = 17
NOW = datetime.now(timezone.utc).isoformat()

price_history_entries = []
for printing_id, foil_price in updates:
    price_history_entries.append({
        'printing_id': printing_id,
        'source_id': CK_SOURCE_ID,
        'condition_id': 16,  # NM
        'price_usd': foil_price,
        'is_foil': True,
        'price_type': 'retail',
        'timestamp': NOW
    })

# Batch update avg_market_price_foil_usd
batch_size = 500
for i in range(0, len(updates), batch_size):
    batch = updates[i:i+batch_size]
    if not batch:
        continue
    
    values = ','.join([f"('{pid}', {price})" for pid, price in batch])
    cur.execute(f"""
        UPDATE card_printings cp
        SET avg_market_price_foil_usd = v.price,
            foil_price = v.price
        FROM (VALUES {values}) AS v(printing_id, price)
        WHERE cp.printing_id::text = v.printing_id
    """)
    updated += cur.rowcount
    print(f"  Batch {i//batch_size + 1}: updated {cur.rowcount} rows")

conn.commit()
print(f"\nTotal rows updated: {updated}")

# Verify Goblin Warchief fix
cur.execute("""
    SELECT c.card_name, s.set_code, cp.avg_market_price_usd, cp.avg_market_price_foil_usd
    FROM card_printings cp
    JOIN cards c ON c.card_id = cp.card_id
    JOIN sets s ON s.set_id = cp.set_id
    WHERE c.card_name ILIKE 'Goblin Warchief' AND s.set_code = 'scg'
""")
rows = cur.fetchall()
print(f"\n=== Goblin Warchief SCG after fix ===")
for r in rows:
    print(r)

cur.close()
conn.close()
print("\nDone!")
