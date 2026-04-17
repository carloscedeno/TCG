"""
INVESTIGACIÓN: Por qué el CK sync no trajo precios para SOA/SOS/SOC/TSOS

1. Descarga (o usa caché) el pricelist de CK
2. Busca cartas de los 4 sets por scryfall_id (comparando contra DB)
3. Reporta cuántas coincidencias hay y cuáles fallan
4. Muestra el nombre de edición que usa CK para esos sets (para el fallback)
"""
import sys, io, time, psycopg2, requests, json, os
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PROJECT_ROOT = Path(__file__).parent.parent
CACHE_FILE = PROJECT_ROOT / "data" / "cache" / "ck_pricelist.json"

DB_PARAMS = dict(
    user="postgres.sxuotvogwvmxuvwbsscv",
    password="jLta9LqEmpMzCI5r",
    host="aws-0-us-west-2.pooler.supabase.com",
    port="6543",
    dbname="postgres"
)

STRIXHAVEN_SETS = ('soa', 'sos', 'soc', 'tsos')

def get_pricelist():
    """Load from cache if exists, otherwise download."""
    if CACHE_FILE.exists():
        age = time.time() - CACHE_FILE.stat().st_mtime
        print(f"Cache found ({age/3600:.1f}h old). Loading...")
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('data', [])
    
    print("No cache found. Downloading from CK API...")
    r = requests.get("https://api.cardkingdom.com/api/v2/pricelist", timeout=60)
    r.raise_for_status()
    data = r.json()
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    print(f"Downloaded and cached {len(data.get('data', []))} entries.")
    return data.get('data', [])

def main():
    print("\n========================================")
    print("INVESTIGACIÓN: CK sync vs Strixhaven")
    print("========================================\n")

    pricelist = get_pricelist()
    print(f"Total entradas CK: {len(pricelist)}")
    
    # Build map: scryfall_id -> list of CK cards
    ck_by_scryfall = {}
    ck_editions = set()
    for card in pricelist:
        sid = card.get('scryfall_id')
        edition = card.get('edition', '')
        if sid:
            ck_by_scryfall.setdefault(sid, []).append(card)
        if 'trixhaven' in edition.lower() or 'mystical' in edition.lower():
            ck_editions.add(edition)
    
    print(f"\nEdiciones de CK que contienen 'Strixhaven' o 'Mystical':")
    for e in sorted(ck_editions):
        count = sum(1 for c in pricelist if c.get('edition') == e)
        print(f"  '{e}' ({count} cartas)")
    
    # Fetch DB Strixhaven printings
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT cp.printing_id, cp.scryfall_id, cp.collector_number,
               s.set_code, s.set_name, c.card_name,
               cp.avg_market_price_usd, cp.avg_market_price_foil_usd
        FROM public.card_printings cp
        JOIN public.sets s ON cp.set_id = s.set_id
        JOIN public.cards c ON cp.card_id = c.card_id
        WHERE LOWER(s.set_code) = ANY(%s)
        ORDER BY s.set_code, cp.collector_number
    """, (list(STRIXHAVEN_SETS),))
    db_cards = cur.fetchall()
    cur.close()
    conn.close()
    
    print(f"\nCartas Strixhaven en DB: {len(db_cards)}")
    
    matched = 0
    no_match_scryfall = []
    
    for (pid, scryfall_id, col_num, set_code, set_name, card_name, price_normal, price_foil) in db_cards:
        ck_entries = ck_by_scryfall.get(str(scryfall_id), [])
        if ck_entries:
            matched += 1
        else:
            no_match_scryfall.append((set_code, col_num, card_name, scryfall_id))
    
    print(f"\nMatched por Scryfall ID: {matched}")
    print(f"Sin match por Scryfall ID: {len(no_match_scryfall)}")
    
    if no_match_scryfall:
        print(f"\nPrimeras 20 cartas SIN match en CK:")
        for (set_code, col_num, name, sid) in no_match_scryfall[:20]:
            print(f"  {set_code.upper()} #{col_num} {name} (scryfall_id: {sid})")
        
        if len(no_match_scryfall) > 20:
            print(f"  ... y {len(no_match_scryfall) - 20} más")
    
    # Try to match by name (see what the fallback would have done)
    # Build DB set_name map
    print(f"\n--- DB Set Names para Strixhaven ---")
    cur2 = psycopg2.connect(**DB_PARAMS).cursor()
    cur2.execute("""
        SELECT DISTINCT s.set_code, s.set_name
        FROM public.sets s
        WHERE LOWER(s.set_code) = ANY(%s)
    """, (list(STRIXHAVEN_SETS),))
    db_sets = cur2.fetchall()
    for (sc, sn) in db_sets:
        print(f"  DB: '{sc}' -> '{sn}'")
    cur2.close()

if __name__ == "__main__":
    main()
