"""
FULL SYNC CK v2 — Optimizado con VALUES batch single-statement.

Evita los 28K SELECTs individuales usando un solo UPDATE con JOIN sobre una tabla temporal.
Tiempo esperado: ~30-60s en total vs >90min con executemany.
"""
import sys, io, json, psycopg2
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

def parse_sku(sku):
    if not sku or '-' not in sku:
        return None
    parts = sku.split('-', 1)
    prefix = parts[0]
    num_str = parts[1]
    is_foil = prefix.startswith('F')
    set_prefix = prefix[1:].lower() if is_foil else prefix.lower()
    col_num = num_str.lstrip('0') or '0'
    return (set_prefix, col_num, is_foil)

def main(dry_run=True):
    mode = "DRY RUN" if dry_run else "LIVE UPDATE"
    print(f"\n{'='*60}")
    print(f"FULL SYNC CK v2 — Todos los sets ({mode})")
    print(f"{'='*60}\n")

    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        pricelist = json.load(f).get('data', [])
    print(f"Pricelist CK: {len(pricelist)} entradas")

    # Build (set_code, col_num, is_foil) -> price map from CK
    # PRIORITY: 'Secrets of' editions over aliases
    ck_map = {}
    for card in pricelist:
        sku = (card.get('sku') or '').strip()
        parsed = parse_sku(sku)
        if not parsed:
            continue
        set_pfx, col_num, is_foil = parsed
        price = float(card.get('price_retail') or 0)
        if price <= 0:
            continue
        key = (set_pfx, col_num, is_foil)
        edition = (card.get('edition') or '').lower()
        is_primary = 'secrets of' in edition
        if key not in ck_map or (is_primary and not ck_map[key].get('is_primary')):
            ck_map[key] = {'price': price, 'name': card.get('name'), 'sku': sku, 'is_primary': is_primary}

    print(f"CK map: {len(ck_map)} entradas únicas\n")

    # Spot-checks
    for check_key, label in [
        (('pls', '42', False), "Diabolic Intent PLS Normal"),
        (('pls', '42', True),  "Diabolic Intent PLS Foil"),
        (('soa', '22', False), "Sleight of Hand SOA Normal"),
        (('soa', '22', True),  "Sleight of Hand SOA Foil"),
    ]:
        entry = ck_map.get(check_key)
        print(f"  {label}: {entry}")

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    # Fetch card_printings: set_code + collector_number -> printing_id
    print("\nFetching card_printings from DB...")
    cur.execute("""
        SELECT cp.printing_id, cp.collector_number,
               LOWER(s.set_code) as set_code,
               cp.avg_market_price_usd,
               cp.avg_market_price_foil_usd
        FROM public.card_printings cp
        JOIN public.sets s ON cp.set_id = s.set_id
    """)
    db_printings = cur.fetchall()
    print(f"  {len(db_printings)} card_printings\n")

    # Build lists of (printing_id, new_price) for normal and foil
    normal_rows = []  # (printing_id_str, price)
    foil_rows   = []

    for (pid, col_num, set_code, old_n, old_f) in db_printings:
        col = col_num.lstrip('0') if col_num else ''
        ck_n = ck_map.get((set_code, col, False))
        ck_f = ck_map.get((set_code, col, True))

        if ck_n:
            new_n = ck_n['price']
            if old_n is None or abs(float(old_n) - new_n) > 0.005:
                normal_rows.append((str(pid), new_n))

        if ck_f:
            new_f = ck_f['price']
            if old_f is None or abs(float(old_f) - new_f) > 0.005:
                foil_rows.append((str(pid), new_f))

    print(f"Actualizaciones a aplicar:")
    print(f"  Normal: {len(normal_rows)}")
    print(f"  Foil:   {len(foil_rows)}")

    if dry_run:
        print(f"\n[DRY RUN] Usa --apply para ejecutar.")
        cur.close()
        conn.close()
        return

    def batch_update(rows, col_normal, col_dupe):
        """Single SQL statement to update all prices using a VALUES list."""
        if not rows:
            return 0
        
        # Split in chunks of 2000 to avoid query size limits
        total = 0
        chunk_size = 2000
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i+chunk_size]
            values_sql = ",".join(["(%s::uuid, %s::numeric)"] * len(chunk))
            flat = [v for row in chunk for v in row]
            sql = f"""
                UPDATE public.card_printings cp
                SET {col_normal} = v.price,
                    {col_dupe} = v.price,
                    updated_at = NOW()
                FROM (VALUES {values_sql}) AS v(pid, price)
                WHERE cp.printing_id = v.pid
            """
            cur.execute(sql, flat)
            total += cur.rowcount
            print(f"  Chunk {i//chunk_size + 1}: {cur.rowcount} rows updated")
        return total

    print("\n--- Actualizando card_printings (normal)...")
    n = batch_update(normal_rows, 'avg_market_price_usd', 'non_foil_price')
    print(f"  Total: {n}")

    print("\n--- Actualizando card_printings (foil)...")
    f = batch_update(foil_rows, 'avg_market_price_foil_usd', 'foil_price')
    print(f"  Total: {f}")

    print("\n--- Actualizando products.price (todos los sets)...")
    cur.execute("""
        UPDATE public.products p
        SET price = CASE
                WHEN LOWER(COALESCE(p.finish,'nonfoil')) IN ('foil','etched')
                    THEN COALESCE(cp.avg_market_price_foil_usd, cp.avg_market_price_usd, p.price)
                ELSE COALESCE(cp.avg_market_price_usd, p.price)
                END,
            price_usd = CASE
                WHEN LOWER(COALESCE(p.finish,'nonfoil')) IN ('foil','etched')
                    THEN COALESCE(cp.avg_market_price_foil_usd, cp.avg_market_price_usd, p.price)
                ELSE COALESCE(cp.avg_market_price_usd, p.price)
                END,
            updated_at = NOW()
        FROM public.card_printings cp
        WHERE p.printing_id = cp.printing_id
          AND COALESCE(
                CASE WHEN LOWER(COALESCE(p.finish,'nonfoil')) IN ('foil','etched')
                     THEN cp.avg_market_price_foil_usd
                     ELSE cp.avg_market_price_usd END,
                0) > 0
    """)
    print(f"  products actualizados: {cur.rowcount}")

    conn.commit()
    print("\nCommit realizado con exito.")

    # Verification
    cur.execute("""
        SELECT p.name, p.set_code, p.finish, p.price
        FROM products p JOIN card_printings cp ON p.printing_id = cp.printing_id
        JOIN cards c ON c.card_id = cp.card_id JOIN sets s ON s.set_id = cp.set_id
        WHERE c.card_name IN ('Diabolic Intent','Sleight of Hand')
          AND s.set_code IN ('pls','soa')
        ORDER BY c.card_name, s.set_code, p.finish
    """)
    print("\n--- Verificacion final ---")
    for row in cur.fetchall():
        print(f"  {row[1].upper()} {row[0]} ({row[2]}): ${row[3]:.2f}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    main(dry_run=not args.apply)
