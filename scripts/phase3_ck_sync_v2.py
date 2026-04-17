"""
CORRECCIÓN: Sincronización CK Strixhaven con manejo correcto de SKU Foil

El pricelist de CK usa:
  - Normal: SOA-0022  (prefijo = set code)
  - Foil:   FSOA-0022 (prefijo = "F" + set code)

El script anterior tomó precios de 'strixhaven mystical archive' (viejo nombre de CK)
en lugar de 'secrets of strixhaven mystical archive' (nombre correcto).

Esta versión:
  1. Solo mapea la edición PRIMARIA (no los aliases)
  2. Extrae foil del prefijo 'F' en el SKU
  3. Prioriza SIEMPRE 'Secrets of Strixhaven' sobre 'Strixhaven' (el alias viejo)
"""
import sys, io, time, json, psycopg2
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

# MAPEO PRIMARIO — usado para parsear el set del SKU directamente
# SKU format: [F]SET-NNNN   e.g.  SOA-0022  FSOA-0022
SKU_PREFIX_TO_DB_SET = {
    "SOA":  "soa",
    "SOS":  "sos",
    "SOC":  "soc",
    "TSOS": "tsos",
    "TSOC": "soc",  # token set commander
}

def load_pricelist():
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        return json.load(f).get('data', [])

def parse_sku(sku):
    """
    Parse a CK SKU into (db_set_code, collector_number, is_foil).
    
    Examples:
      SOA-0022   -> ('soa', '22', False)
      FSOA-0022  -> ('soa', '22', True)
      SOS-0058   -> ('sos', '58', False)
      FSOS-0058  -> ('sos', '58', True)
      TSOS-0008  -> ('tsos', '8', False)
    
    Returns None if not a Strixhaven SKU.
    """
    if not sku or '-' not in sku:
        return None
    
    parts = sku.split('-', 1)
    prefix = parts[0]   # e.g. "SOA", "FSOA", "FSOS", "TSOS"
    num_str = parts[1]  # e.g. "0022"
    
    # Determine foil
    is_foil = prefix.startswith('F')
    set_prefix = prefix[1:] if is_foil else prefix  # strip F prefix
    
    # Handle token sets
    db_set = SKU_PREFIX_TO_DB_SET.get(set_prefix)
    if db_set is None:
        return None
    
    # Normalize collector number: strip leading zeros but keep at least '0'
    col_num = num_str.lstrip('0') or '0'
    
    return (db_set, col_num, is_foil)

def build_ck_map(pricelist):
    """Build (db_set, collector_number, is_foil) -> price map using SKU parsing."""
    ck_map = {}
    skipped = 0
    
    for card in pricelist:
        sku = (card.get('sku') or '').strip()
        parsed = parse_sku(sku)
        if parsed is None:
            continue
        
        db_set, col_num, is_foil = parsed
        price = float(card.get('price_retail') or 0)
        
        if price <= 0:
            skipped += 1
            continue
        
        key = (db_set, col_num, is_foil)
        # If duplicate, prefer the PRIMARY edition (Secrets of Strixhaven) over aliases
        # The primary one will have 'secrets of' in the edition name
        edition = (card.get('edition') or '').lower()
        is_primary = 'secrets of' in edition
        
        if key not in ck_map:
            ck_map[key] = {'price': price, 'edition': edition, 'name': card.get('name'), 'sku': sku, 'is_primary': is_primary}
        elif is_primary and not ck_map[key]['is_primary']:
            # Override with primary edition
            ck_map[key] = {'price': price, 'edition': edition, 'name': card.get('name'), 'sku': sku, 'is_primary': is_primary}
    
    return ck_map

def main(dry_run=True):
    mode = "DRY RUN" if dry_run else "LIVE UPDATE"
    print(f"\n{'='*60}")
    print(f"CORRECCIÓN CK — Sincronización Strixhaven v2 ({mode})")
    print(f"SKU-based matching | Foil prefix 'F' handled")
    print(f"{'='*60}\n")
    
    pricelist = load_pricelist()
    print(f"Pricelist CK cargado: {len(pricelist)} entradas")
    
    ck_map = build_ck_map(pricelist)
    print(f"Entradas Strixhaven mapeadas (via SKU): {len(ck_map)}")
    
    # Spot-check SOA #22
    key_normal = ('soa', '22', False)
    key_foil   = ('soa', '22', True)
    print(f"\nSpot-check SOA #22:")
    print(f"  Normal: {ck_map.get(key_normal)}")
    print(f"  Foil:   {ck_map.get(key_foil)}")
    
    # Load DB Strixhaven printings
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    cur.execute("""
        SELECT cp.printing_id, cp.collector_number, s.set_code, c.card_name,
               cp.avg_market_price_usd, cp.avg_market_price_foil_usd
        FROM public.card_printings cp
        JOIN public.sets s ON cp.set_id = s.set_id
        JOIN public.cards c ON cp.card_id = c.card_id
        WHERE LOWER(s.set_code) = ANY(ARRAY['sos','soa','soc','tsos'])
        ORDER BY s.set_code, cp.collector_number
    """)
    db_printings = cur.fetchall()
    print(f"\nCartas Strixhaven en DB: {len(db_printings)}")
    
    normal_updates = []
    foil_updates   = []
    no_match       = []
    
    for (pid, col_num, set_code, card_name, old_normal, old_foil) in db_printings:
        col_stripped = col_num.lstrip('0') if col_num else ''
        
        ck_normal = ck_map.get((set_code, col_stripped, False))
        ck_foil   = ck_map.get((set_code, col_stripped, True))
        
        if ck_normal:
            new_n = ck_normal['price']
            if old_normal is None or abs(float(old_normal) - new_n) > 0.001:
                normal_updates.append((pid, card_name, set_code, col_stripped, old_normal, new_n))
        
        if ck_foil:
            new_f = ck_foil['price']
            if old_foil is None or abs(float(old_foil) - new_f) > 0.001:
                foil_updates.append((pid, card_name, set_code, col_stripped, old_foil, new_f))
        
        if not ck_normal and not ck_foil:
            no_match.append((set_code, col_stripped, card_name))
    
    print(f"\nActualizaciones NORMAL: {len(normal_updates)}")
    print(f"Actualizaciones FOIL:   {len(foil_updates)}")
    print(f"Sin match:              {len(no_match)}")
    
    # Show corrections for Sleight of Hand
    print(f"\n--- Correcciones para Sleight of Hand ---")
    soh_normal = [(pid, n, sc, col, old, new) for (pid, n, sc, col, old, new) in normal_updates if 'Sleight' in n]
    soh_foil   = [(pid, n, sc, col, old, new) for (pid, n, sc, col, old, new) in foil_updates if 'Sleight' in n]
    for (pid, name, sc, col, old, new) in soh_normal:
        print(f"  {sc.upper()} #{col} {name} NORMAL: ${float(old):.2f} → ${new:.2f}")
    for (pid, name, sc, col, old, new) in soh_foil:
        print(f"  {sc.upper()} #{col} {name} FOIL: ${float(old):.2f} → ${new:.2f}")
    
    # Show sample of 10 updates
    print(f"\n--- Muestra de 10 actualizaciones NORMAL ---")
    for (pid, name, sc, col, old, new) in normal_updates[:10]:
        old_str = f"${float(old):.2f}" if old is not None else "NULL"
        print(f"  {sc.upper()} #{col} {name}: {old_str} → ${new:.2f}")
    
    if not dry_run and (normal_updates or foil_updates):
        print(f"\n{'='*60}")
        print("APLICANDO CAMBIOS...")
        print(f"{'='*60}")
        
        # Update card_printings normal prices
        for (pid, name, sc, col, old, new) in normal_updates:
            cur.execute("""
                UPDATE public.card_printings 
                SET avg_market_price_usd = %s, non_foil_price = %s, updated_at = NOW()
                WHERE printing_id = %s
            """, (new, new, pid))
        print(f"  card_printings normal: {len(normal_updates)} actualizados")
        
        # Update card_printings foil prices
        for (pid, name, sc, col, old, new) in foil_updates:
            cur.execute("""
                UPDATE public.card_printings 
                SET avg_market_price_foil_usd = %s, foil_price = %s, updated_at = NOW()
                WHERE printing_id = %s
            """, (new, new, pid))
        print(f"  card_printings foil: {len(foil_updates)} actualizados")
        
        # Update products.price based on finish
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
            JOIN public.sets s ON cp.set_id = s.set_id
            WHERE p.printing_id = cp.printing_id
              AND LOWER(s.set_code) = ANY(ARRAY['sos','soa','soc','tsos'])
              AND COALESCE(
                    CASE WHEN LOWER(COALESCE(p.finish,'nonfoil')) IN ('foil','etched') 
                         THEN cp.avg_market_price_foil_usd 
                         ELSE cp.avg_market_price_usd END,
                    0) > 0
        """)
        print(f"  products: {cur.rowcount} actualizados")
        
        conn.commit()
        print("\nCommit realizado.")
        
        # Verification
        cur.execute("""
            SELECT p.name, p.set_code, p.finish, p.price
            FROM public.products p
            WHERE LOWER(p.set_code) = 'soa'
              AND p.name ILIKE '%Sleight of Hand%'
        """)
        print("\n--- Verificacion: Sleight of Hand ---")
        for row in cur.fetchall():
            print(f"  {row[1].upper()} {row[0]} ({row[2]}): ${row[3]:.2f}")
    elif dry_run:
        print(f"\n[DRY RUN] Ningún cambio aplicado. Usa --apply para ejecutar.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    main(dry_run=not args.apply)
