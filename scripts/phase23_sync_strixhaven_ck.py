"""
FASES 2 y 3 — Sincronización CK para Strixhaven por nombre de edición

Usa el pricelist descargado (ya en caché) y empareja por:
  (edition_name.lower(), collector_number.strip()) → DB card

Mapeo de nombres:
  CK                                    → DB set_code
  'Secrets of Strixhaven'               → 'sos'
  'Secrets of Strixhaven Mystical Archive' → 'soa'  
  'Secrets of Strixhaven Commander Decks'  → 'soc'
  'Secrets of Strixhaven Tokens'        → 'tsos'

FASE 2: Detecta y muestra precios contaminados
FASE 3: Aplica precios correctos de CK

Seguridad:
  - Solo toca productos con printing_id en ('soa','sos','soc','tsos')
  - No modifica carts, cart_items, orders, order_items
  - DRY RUN por defecto
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

# Mapeo CK edition name → DB set_code (lowercase)
CK_TO_DB_SETS = {
    "secrets of strixhaven": "sos",
    "secrets of strixhaven variants": "sos",
    "secrets of strixhaven mystical archive": "soa",
    "secrets of strixhaven mystical archive jpn": "soa",
    "strixhaven mystical archive": "soa",           # versión vieja de CK
    "strixhaven mystical archive jpn": "soa",
    "secrets of strixhaven commander decks": "soc",
    "secrets of strixhaven commander decks variants": "soc",
    "secrets of strixhaven tokens": "tsos",
}

def load_pricelist():
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        return json.load(f).get('data', [])

def build_ck_maps(pricelist):
    """Build lookup maps from CK pricelist for Strixhaven editions.
    
    CK uses SKU format 'SOA-0024' where the number after '-' is the collector number.
    The 'variation' field is EMPTY for Strixhaven cards.
    """
    # Map (db_set_code, collector_number_padded, is_foil) -> CK card
    ck_map = {}
    
    for card in pricelist:
        edition = (card.get('edition') or '').lower().strip()
        db_set = CK_TO_DB_SETS.get(edition)
        if db_set is None:
            continue
        
        # Extract collector number from SKU: "SOA-0024" -> "22" (strip leading zeros)
        sku = (card.get('sku') or '').strip()
        if '-' not in sku:
            continue
        sku_parts = sku.split('-', 1)
        raw_num = sku_parts[1]  # "0024"
        col_num_stripped = raw_num.lstrip('0') or '0'  # "24" (strip leading zeros)
        col_num_padded = raw_num  # "0024" (keep as-is for direct match)
        
        is_foil = card.get('is_foil') == 'true' or card.get('is_foil') is True
        price = float(card.get('price_retail') or 0)
        
        if price > 0:
            for col_num in [col_num_stripped, col_num_padded, raw_num.lstrip('0').zfill(2)]:
                if not col_num:
                    continue
                key = (db_set, col_num, is_foil)
                if key not in ck_map or price > ck_map[key]['price']:
                    ck_map[key] = {
                        'price': price,
                        'edition': edition,
                        'name': card.get('name'),
                        'is_foil': is_foil,
                        'sku': sku,
                    }
    
    return ck_map

def main(dry_run=True):
    mode = "DRY RUN" if dry_run else "LIVE UPDATE"
    print(f"\n{'='*60}")
    print(f"FASE 3 — Sincronización CK Strixhaven ({mode})")
    print(f"{'='*60}\n")
    
    # Load CK pricelist
    pricelist = load_pricelist()
    print(f"Pricelist CK cargado: {len(pricelist)} entradas")
    
    ck_map = build_ck_maps(pricelist)
    print(f"Entradas Strixhaven en CK mapeadas: {len(ck_map)}")
    
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
    print(f"Cartas Strixhaven en DB: {len(db_printings)}\n")
    
    # Match and build updates
    normal_updates = []   # (printing_id, card_name, set_code, col_num, old_price, new_price)
    foil_updates   = []
    not_matched    = []
    
    for (pid, col_num, set_code, card_name, old_normal, old_foil) in db_printings:
        col_num_clean = col_num.lstrip('0') if col_num else ''
        
        # Try with both padded and unpadded collector numbers
        ck_normal = ck_map.get((set_code, col_num, False)) or ck_map.get((set_code, col_num_clean, False))
        ck_foil   = ck_map.get((set_code, col_num, True))  or ck_map.get((set_code, col_num_clean, True))
        
        if ck_normal:
            new_normal = ck_normal['price']
            if old_normal is None or abs(float(old_normal) - new_normal) > 0.001:
                normal_updates.append((pid, card_name, set_code, col_num, old_normal, new_normal))
        
        if ck_foil:
            new_foil = ck_foil['price']
            if old_foil is None or abs(float(old_foil) - new_foil) > 0.001:
                foil_updates.append((pid, card_name, set_code, col_num, old_foil, new_foil))
        
        if not ck_normal and not ck_foil:
            not_matched.append((set_code, col_num, card_name))
    
    print(f"Actualizaciones de precio NORMAL: {len(normal_updates)}")
    print(f"Actualizaciones de precio FOIL:   {len(foil_updates)}")
    print(f"Sin match en CK:                  {len(not_matched)}")
    
    # Show sample of updates
    print(f"\n--- Muestra de actualizaciones NORMAL (primeras 15) ---")
    for (pid, name, sc, col, old, new) in normal_updates[:15]:
        old_str = f"${float(old):.2f}" if old is not None else "NULL"
        print(f"  {sc.upper()} #{col} {name}: {old_str} → ${new:.2f}")
    
    print(f"\n--- Muestra de actualizaciones FOIL (primeras 15) ---")
    for (pid, name, sc, col, old, new) in foil_updates[:15]:
        old_str = f"${float(old):.2f}" if old is not None else "NULL"
        print(f"  {sc.upper()} #{col} {name}: {old_str} → ${new:.2f}")
    
    if not_matched[:10]:
        print(f"\n--- Cartas sin match en CK (primeros 10) ---")
        for (sc, col, name) in not_matched[:10]:
            print(f"  {sc.upper()} #{col} {name}")
    
    # FASE 2 check: detect contaminated products
    print(f"\n{'='*60}")
    print(f"FASE 2 — Detección de precios contaminados en products")
    print(f"{'='*60}")
    cur.execute("""
        SELECT p.id, p.name, p.set_code, p.finish, p.price, p.printing_id
        FROM public.products p
        WHERE LOWER(p.set_code) = ANY(ARRAY['sos','soa','soc','tsos'])
          AND p.price > 0
    """)
    strix_products = cur.fetchall()
    print(f"\nProductos Strixhaven en stock: {len(strix_products)}")
    
    contaminated = []
    for (prod_id, name, set_code, finish, price, pid) in strix_products:
        is_foil = finish and finish.lower() in ('foil', 'etched')
        col_num = None
        # Find collector number for this printing_id
        for (db_pid, db_col, db_sc, db_name, _, _) in db_printings:
            if str(db_pid) == str(pid):
                col_num = db_col
                break
        
        if col_num is None:
            continue
        
        col_num_clean = col_num.lstrip('0') if col_num else ''
        expected_entry = (
            ck_map.get((set_code, col_num, is_foil)) or 
            ck_map.get((set_code, col_num_clean, is_foil))
        )
        
        if expected_entry:
            expected_price = expected_entry['price']
            diff = abs(float(price) - expected_price)
            # Flag as contaminated if difference is > 10% AND > $5
            if diff > 5 and diff / expected_price > 0.1:
                contaminated.append({
                    'id': prod_id,
                    'name': name,
                    'set_code': set_code,
                    'finish': finish,
                    'current_price': float(price),
                    'expected_price': expected_price,
                    'diff': diff,
                    'printing_id': pid,
                })
    
    print(f"Precios contaminados detectados: {len(contaminated)}")
    for c in contaminated:
        print(f"  {c['set_code'].upper()} {c['name']} ({c['finish']}): ${c['current_price']:.2f} → ${c['expected_price']:.2f} (diff: ${c['diff']:.2f})")
    
    if not dry_run:
        print(f"\n{'='*60}")
        print(f"APLICANDO CAMBIOS...")
        print(f"{'='*60}")
        
        CK_SOURCE_ID = 17
        NOW = datetime.now(timezone.utc).isoformat()
        
        # Update card_printings — avg_market_price_usd (normal prices)
        batch_count = 0
        for (pid, name, sc, col, old, new) in normal_updates:
            cur.execute("""
                UPDATE public.card_printings 
                SET avg_market_price_usd = %s, non_foil_price = %s, updated_at = NOW()
                WHERE printing_id = %s
            """, (new, new, pid))
            batch_count += 1
        print(f"  card_printings normal: {batch_count} actualizados")
        
        # Update card_printings — avg_market_price_foil_usd
        foil_count = 0
        for (pid, name, sc, col, old, new) in foil_updates:
            cur.execute("""
                UPDATE public.card_printings 
                SET avg_market_price_foil_usd = %s, foil_price = %s, updated_at = NOW()
                WHERE printing_id = %s
            """, (new, new, pid))
            foil_count += 1
        print(f"  card_printings foil: {foil_count} actualizados")
        
        # Update products.price based on finish
        prod_count = 0
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
        prod_count = cur.rowcount
        print(f"  products: {prod_count} actualizados")
        
        conn.commit()
        print(f"\nCommit realizado con exito.")
        
        # Final verification
        cur.execute("""
            SELECT p.name, p.set_code, p.finish, p.price
            FROM public.products p
            WHERE LOWER(p.set_code) = ANY(ARRAY['sos','soa','soc','tsos'])
              AND p.name ILIKE '%Sleight of Hand%'
        """)
        print(f"\n--- Verificacion: Sleight of Hand ---")
        for row in cur.fetchall():
            print(f"  {row[1].upper()} {row[0]} ({row[2]}): ${row[3]:.2f}")
        
        cur.execute("""
            SELECT p.name, p.set_code, p.finish, p.price
            FROM public.products p
            WHERE LOWER(p.set_code) = ANY(ARRAY['sos','soa','soc','tsos'])
              AND p.name ILIKE '%Force of Will%'
        """)
        print(f"--- Verificacion: Force of Will ---")
        for row in cur.fetchall():
            print(f"  {row[1].upper()} {row[0]} ({row[2]}): ${row[3]:.2f}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Aplicar cambios (sin esto es DRY RUN)")
    args = parser.parse_args()
    main(dry_run=not args.apply)
