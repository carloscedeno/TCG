"""
Diagnóstico rápido: Investigar precios contaminados en sets NO-Strixhaven.
Compara products.price vs lo que CK tiene en el pricelist para todos los sets.
"""
import json, sys, io, psycopg2
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

# 1. Check PLS Diabolic Intent specifically
conn = psycopg2.connect(**DB_PARAMS)
cur = conn.cursor()

print("=== Diabolic Intent PLS — Estado actual en DB ===")
cur.execute("""
    SELECT cp.collector_number, s.set_code, c.card_name,
           cp.avg_market_price_usd, cp.avg_market_price_foil_usd,
           p.price, p.finish, p.updated_at
    FROM card_printings cp
    JOIN cards c ON cp.card_id = c.card_id
    JOIN sets s ON cp.set_id = s.set_id
    LEFT JOIN products p ON cp.printing_id = p.printing_id
    WHERE c.card_name ILIKE 'Diabolic Intent'
    AND s.set_code = 'pls'
""")
for row in cur.fetchall():
    print(f"  Col: {row[0]} | Set: {row[1]} | Name: {row[2]}")
    print(f"  cp.normal: {row[3]} | cp.foil: {row[4]}")
    print(f"  p.price: {row[5]} | p.finish: {row[6]} | updated_at: {row[7]}")

# 2. Check what's in CK pricelist for PLS
print("\n=== Diabolic Intent en CK pricelist ===")
with open(CACHE_FILE, 'r', encoding='utf-8') as f:
    pricelist = json.load(f).get('data', [])

pls_di = [c for c in pricelist if 'Diabolic Intent' in c.get('name','') and 'Planeshift' in c.get('edition','')]
for c in pls_di:
    print(f"  SKU: {c.get('sku')} | Edition: {c.get('edition')} | Foil: {c.get('is_foil')} | Price: {c.get('price_retail')}")

# 3. How many products currently have suspicious prices (> $100) in NON-Strixhaven sets
print("\n=== Productos NON-Strixhaven con precio > $100 (potencialmente contaminados) ===")
cur.execute("""
    SELECT p.name, p.set_code, p.finish, p.price, p.updated_at
    FROM public.products p
    WHERE LOWER(p.set_code) NOT IN ('sos','soa','soc','tsos')
    AND p.price > 100
    ORDER BY p.price DESC, p.updated_at DESC
    LIMIT 30
""")
rows = cur.fetchall()
print(f"Total: {cur.rowcount if cur.rowcount > 0 else len(rows)} productos > $100 fuera de Strixhaven")
for row in rows:
    print(f"  {row[1].upper()} {row[0]} ({row[2]}): ${row[3]:.2f} | updated: {row[4]}")

cur.close()
conn.close()
