import os
import sys
import psycopg2
import requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv('DATABASE_URL')
CK_SOURCE_ID = 17 # Verified source_id for CardKingdom in production
NM_CONDITION_ID = 16 # Verified condition_id for NM in production

def sync_production():
    print(f"--- INICIANDO SINCRONIZACIÓN FORZADA (PRODUCCIÓN) ---")
    print(f"DB: {DB_URL.split('@')[-1] if DB_URL else 'ERROR: No DATABASE_URL'}")
    
    if not DB_URL:
        return

    try:
        # 1. Download CK Pricelist
        print("Descargando precios de CardKingdom API...")
        r = requests.get("https://api.cardkingdom.com/api/v2/pricelist", timeout=60)
        r.raise_for_status()
        pricelist = r.json().get('data', [])
        print(f"Descargados {len(pricelist)} items.")

        # 2. Connect to DB
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # 3. Process matches (Limited to SOS for now to be fast, or full if requested)
        # For this emergency, we'll focus on SOS set to fix Witherbloom immediately
        print("Procesando actualizaciones para el set 'Secrets of Strixhaven' (SOS)...")
        
        # Get printing_ids and scryfall_ids for SOS
        cur.execute("SELECT printing_id, scryfall_id FROM card_printings WHERE set_code = 'sos'")
        db_cards = {r[1]: r[0] for r in cur.fetchall() if r[1]}
        print(f"Encontradas {len(db_cards)} cartas en el set SOS en la DB.")

        updates = 0
        now = datetime.now(timezone.utc)

        for item in pricelist:
            scid = item.get('scryfall_id')
            if scid in db_cards:
                printing_id = db_cards[scid]
                price = float(item.get('condition_values', {}).get('nm_price', 0))
                is_foil = item.get('is_foil') == 'true'
                
                if price > 0:
                    # Insert into price_history
                    cur.execute("""
                        INSERT INTO price_history (printing_id, source_id, condition_id, price_usd, is_foil, timestamp, price_type)
                        VALUES (%s, %s, %s, %s, %s, %s, 'market')
                    """, (printing_id, CK_SOURCE_ID, NM_CONDITION_ID, price, is_foil, now))
                    updates += 1

        conn.commit()
        print(f"Insertados {updates} nuevos registros de precios en price_history.")

        # 4. Propagate to card_printings and products
        print("Propagando precios a catálogo e inventario (Denormalización)...")
        
        # Batch update card_printings
        cur.execute("""
            UPDATE card_printings cp
            SET 
                avg_market_price_usd = CASE WHEN ph.is_foil = FALSE THEN ph.price_usd ELSE cp.avg_market_price_usd END,
                avg_market_price_foil_usd = CASE WHEN ph.is_foil = TRUE THEN ph.price_usd ELSE cp.avg_market_price_foil_usd END,
                updated_at = NOW()
            FROM (
                SELECT DISTINCT ON (printing_id, is_foil) printing_id, is_foil, price_usd
                FROM price_history
                WHERE source_id = %s AND timestamp >= %s
                ORDER BY printing_id, is_foil, timestamp DESC
            ) ph
            WHERE cp.printing_id = ph.printing_id
        """, (CK_SOURCE_ID, now))
        print(f"Catálogo actualizado ({cur.rowcount} impresiones).")

        # Propagate to products (Store)
        cur.execute("""
            UPDATE products p
            SET price = CASE WHEN p.finish = 'foil' THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END
            FROM card_printings cp
            WHERE p.printing_id = cp.printing_id
            AND cp.set_code = 'sos'
        """)
        print(f"Tienda actualizada ({cur.rowcount} productos de SOS).")

        conn.commit()
        cur.close()
        conn.close()
        print("--- SINCRONIZACIÓN COMPLETADA CON ÉXITO ---")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    sync_production()
