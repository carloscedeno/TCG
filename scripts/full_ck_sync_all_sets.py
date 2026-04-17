"""
FULL SYNC — Sincronización CK completa para TODOS los sets.

Usa el mismo parser de SKU que ya funciona para Strixhaven:
  - Normal: SET-NNNN
  - Foil:   FSET-NNNN

Prioriza siempre el pricelist de CK sobre el precio actual en DB
solo cuando el precio actual NO coincide con lo que CK tiene.

SEGURIDAD:
  - No toca carts, cart_items, orders, order_items
  - DRY RUN muestra primero los cambios, --apply para ejecutar
  - Muestra top-20 correcciones para revisión
"""
import sys, io, json, psycopg2
from pathlib import Path
from datetime import datetime, timezone

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
    """
    Parse CK SKU -> (set_prefix, collector_number_stripped, is_foil)
    
    Examples:
      PLS-042   -> ('pls', '42', False)
      FPLS-042  -> ('pls', '42', True)
      SOA-0022  -> ('soa', '22', False)
      FSOA-0022 -> ('soa', '22', True)
    """
    if not sku or '-' not in sku:
        return None
    parts = sku.split('-', 1)
    prefix = parts[0]
    num_str = parts[1]
    is_foil = prefix.startswith('F')
    set_prefix = prefix[1:].lower() if is_foil else prefix.lower()
    col_num = num_str.lstrip('0') or '0'
    return (set_prefix, col_num, is_foil)

def build_full_ck_map(pricelist):
    """Build complete map (ck_set_prefix, col_num, is_foil) -> price."""
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
        if key not in ck_map:
            ck_map[key] = {'price': price, 'name': card.get('name'), 'edition': card.get('edition'), 'sku': sku}
    return ck_map

def main(dry_run=True):
    mode = "DRY RUN" if dry_run else "LIVE UPDATE"
    print(f"\n{'='*60}")
    print(f"FULL SYNC CK — Todos los sets ({mode})")
    print(f"{'='*60}\n")

    print("Cargando pricelist CK...")
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        pricelist = json.load(f).get('data', [])
    print(f"  {len(pricelist)} entradas en pricelist")

    ck_map = build_full_ck_map(pricelist)
    print(f"  {len(ck_map)} entradas únicas (set, col_num, foil)")

    # Spot-check PLS Diabolic Intent
    print(f"\nSpot-check PLS #42 (Diabolic Intent):")
    print(f"  Normal: {ck_map.get(('pls', '42', False))}")
    print(f"  Foil:   {ck_map.get(('pls', '42', True))}")

    # Build DB set_code -> CK set prefix mapping by fetching card_printings
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    print("\nFetching card_printings from DB (batched)...")
    
    # We need to match DB set_code with CK set prefix.
    # CK set prefix = set_code.lower() in most cases (e.g. PLS, 7ED, SOA, MRD)
    # Strategy: use the DB set_code as-is as the CK prefix (both use same codes)
    
    cur.execute("""
        SELECT cp.printing_id, cp.collector_number,
               LOWER(s.set_code) as set_code,
               cp.avg_market_price_usd,
               cp.avg_market_price_foil_usd
        FROM public.card_printings cp
        JOIN public.sets s ON cp.set_id = s.set_id
    """)
    db_printings = cur.fetchall()
    print(f"  {len(db_printings)} card_printings en DB\n")

    normal_updates = {}  # printing_id -> new_price
    foil_updates   = {}  # printing_id -> new_price

    for (pid, col_num, set_code, old_normal, old_foil) in db_printings:
        col_stripped = col_num.lstrip('0') if col_num else ''
        
        ck_n = ck_map.get((set_code, col_stripped, False))
        ck_f = ck_map.get((set_code, col_stripped, True))

        if ck_n:
            new_n = ck_n['price']
            if old_normal is None or abs(float(old_normal) - new_n) > 0.005:
                normal_updates[str(pid)] = (new_n, old_normal, set_code, col_stripped, ck_n['name'])

        if ck_f:
            new_f = ck_f['price']
            if old_foil is None or abs(float(old_foil) - new_f) > 0.005:
                foil_updates[str(pid)] = (new_f, old_foil, set_code, col_stripped, ck_f['name'])

    print(f"Actualizaciones detectadas:")
    print(f"  Normal: {len(normal_updates)}")
    print(f"  Foil:   {len(foil_updates)}")

    # Check PLS Diabolic Intent specifically
    cur.execute("""
        SELECT cp.printing_id::text FROM card_printings cp
        JOIN sets s ON s.set_id = cp.set_id
        JOIN cards c ON c.card_id = cp.card_id
        WHERE c.card_name = 'Diabolic Intent' AND s.set_code = 'pls'
    """)
    di_pls_id = (cur.fetchone() or [None])[0]
    if di_pls_id:
        print(f"\nDiabolic Intent PLS printing_id: {di_pls_id}")
        print(f"  Normal update: {normal_updates.get(di_pls_id)}")
        print(f"  Foil update:   {foil_updates.get(di_pls_id)}")

    # Show biggest corrections (biggest decrease = most contaminated)
    corrections = []
    for pid_str, (new_p, old_p, sc, col, name) in normal_updates.items():
        if old_p is not None:
            diff = float(old_p) - new_p
            corrections.append((diff, sc.upper(), col, name, float(old_p), new_p, 'normal'))
    corrections.sort(reverse=True)

    print(f"\n--- Top 20 correcciones más grandes (Normal) ---")
    for (diff, sc, col, name, old, new, t) in corrections[:20]:
        print(f"  {sc} #{col} {name}: ${old:.2f} → ${new:.2f} (diff: ${diff:.2f})")

    if not dry_run and (normal_updates or foil_updates):
        print(f"\n{'='*60}")
        print("APLICANDO CAMBIOS...")
        print(f"{'='*60}")

        # Batch UPDATE card_printings for normal prices
        batch = [(new_p, pid) for pid, (new_p, *_) in normal_updates.items()]
        for i in range(0, len(batch), 500):
            sub = batch[i:i+500]
            cur.executemany(
                "UPDATE public.card_printings SET avg_market_price_usd = %s, non_foil_price = %s, updated_at = NOW() WHERE printing_id = %s::uuid",
                [(p, p, pid) for (p, pid) in sub]
            )
        print(f"  card_printings normal: {len(normal_updates)} actualizados")

        # Batch UPDATE card_printings for foil prices
        batch_f = [(new_p, pid) for pid, (new_p, *_) in foil_updates.items()]
        for i in range(0, len(batch_f), 500):
            sub = batch_f[i:i+500]
            cur.executemany(
                "UPDATE public.card_printings SET avg_market_price_foil_usd = %s, foil_price = %s, updated_at = NOW() WHERE printing_id = %s::uuid",
                [(p, p, pid) for (p, pid) in sub]
            )
        print(f"  card_printings foil: {len(foil_updates)} actualizados")

        # Update products.price for ALL sets based on corrected card_printings
        cur.execute("""
            UPDATE public.products p
            SET price = CASE
                    WHEN LOWER(COALESCE(p.finish,'nonfoil')) IN ('foil','etched')
                        THEN cp.avg_market_price_foil_usd
                    ELSE cp.avg_market_price_usd
                    END,
                price_usd = CASE
                    WHEN LOWER(COALESCE(p.finish,'nonfoil')) IN ('foil','etched')
                        THEN cp.avg_market_price_foil_usd
                    ELSE cp.avg_market_price_usd
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
        print(f"  products: {cur.rowcount} actualizados")

        conn.commit()
        print("\nCommit realizado.")

        # Verify PLS Diabolic Intent
        cur.execute("""
            SELECT p.name, p.set_code, p.finish, p.price
            FROM products p
            JOIN card_printings cp ON p.printing_id = cp.printing_id
            JOIN cards c ON c.card_id = cp.card_id
            JOIN sets s ON s.set_id = cp.set_id
            WHERE c.card_name = 'Diabolic Intent' AND s.set_code = 'pls'
        """)
        print("\n--- Verificacion: Diabolic Intent PLS ---")
        for row in cur.fetchall():
            print(f"  {row[1].upper()} {row[0]} ({row[2]}): ${row[3]:.2f}")

    elif dry_run:
        print(f"\n[DRY RUN] Usa --apply para ejecutar los cambios.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    main(dry_run=not args.apply)
