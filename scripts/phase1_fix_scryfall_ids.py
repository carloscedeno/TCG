"""
FASE 1 — Corrección de Scryfall IDs para Strixhaven (SOA, SOS, SOC, TSOS)

Estrategia:
  - Para cada carta en esos sets, busca en Scryfall por set_code + collector_number
  - Si el scryfall_id obtenido es distinto al que está en la DB, lo marcamos para update
  - DRY RUN primero: solo muestra cambios sin aplicarlos

Seguridad:
  - WHERE set_code IN ('soa','sos','soc','tsos') en TODOS los queries
  - No toca products, carts, cart_items, orders
"""
import sys
import io
import time
import psycopg2
import requests

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_PARAMS = dict(
    user="postgres.sxuotvogwvmxuvwbsscv",
    password="jLta9LqEmpMzCI5r",
    host="aws-0-us-west-2.pooler.supabase.com",
    port="6543",
    dbname="postgres"
)

STRIXHAVEN_SETS = ('soa', 'sos', 'soc', 'tsos')

def fetch_scryfall_id(set_code, collector_number, card_name):
    """Query Scryfall API for the real scryfall_id of a card."""
    # Scryfall collector search: /cards/:set/:collector_number
    url = f"https://api.scryfall.com/cards/{set_code.lower()}/{collector_number}"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return data.get("id"), data.get("name")
        elif r.status_code == 404:
            return None, None
        else:
            print(f"  [WARN] Scryfall {r.status_code} for {set_code}/{collector_number}")
            return None, None
    except Exception as e:
        print(f"  [ERROR] Request failed for {set_code}/{collector_number}: {e}")
        return None, None

def run(dry_run=True):
    mode = "DRY RUN" if dry_run else "LIVE UPDATE"
    print(f"\n{'='*60}")
    print(f"FASE 1 — Corrección de Scryfall IDs ({mode})")
    print(f"Sets afectados: {STRIXHAVEN_SETS}")
    print(f"{'='*60}\n")

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    # Fetch all Strixhaven printings from DB
    cur.execute("""
        SELECT cp.printing_id, cp.scryfall_id, cp.collector_number, 
               s.set_code, s.set_name, c.card_name
        FROM public.card_printings cp
        JOIN public.sets s ON cp.set_id = s.set_id
        JOIN public.cards c ON cp.card_id = c.card_id
        WHERE LOWER(s.set_code) = ANY(%s)
        ORDER BY s.set_code, cp.collector_number::integer
    """, (list(STRIXHAVEN_SETS),))
    printings = cur.fetchall()
    print(f"Total cartas a verificar: {len(printings)}\n")

    to_update = []  # (printing_id, new_scryfall_id, card_name, set_code, col_num)
    already_correct = 0
    not_found = 0

    for (printing_id, db_scryfall_id, col_num, set_code, set_name, card_name) in printings:
        # Rate limit: 100ms between Scryfall requests (their limit is 10/sec)
        time.sleep(0.12)
        
        real_id, sf_name = fetch_scryfall_id(set_code, col_num, card_name)
        
        if real_id is None:
            print(f"  [NOT FOUND] {set_code.upper()} #{col_num} {card_name}")
            not_found += 1
            continue

        if str(real_id) == str(db_scryfall_id):
            already_correct += 1
            continue

        print(f"  [MISMATCH] {set_code.upper()} #{col_num} {card_name}")
        print(f"    DB ID:      {db_scryfall_id}")
        print(f"    REAL ID:    {real_id}")
        to_update.append((printing_id, real_id, card_name, set_code, col_num))

    print(f"\n--- RESUMEN ---")
    print(f"  Ya correctos:      {already_correct}")
    print(f"  No encontrados:    {not_found}")
    print(f"  Requieren update:  {len(to_update)}")

    if not dry_run and to_update:
        print(f"\nAplicando {len(to_update)} correcciones...")
        for (printing_id, new_id, card_name, set_code, col_num) in to_update:
            cur.execute(
                "UPDATE public.card_printings SET scryfall_id = %s WHERE printing_id = %s",
                (new_id, printing_id)
            )
            print(f"  Updated: {set_code.upper()} #{col_num} {card_name} → {new_id}")
        conn.commit()
        print(f"\nCommit realizado. {len(to_update)} IDs actualizados.")
    elif dry_run and to_update:
        print(f"\n[DRY RUN] ningún cambio aplicado. Re-ejecuta con dry_run=False para aplicar.")

    cur.close()
    conn.close()
    return to_update

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Aplicar cambios (sin esto es DRY RUN)")
    args = parser.parse_args()
    run(dry_run=not args.apply)
