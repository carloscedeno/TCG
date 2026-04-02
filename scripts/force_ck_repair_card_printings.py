
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def force_ck_repair_card_printings():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            # 1. Get CK Source ID
            cur.execute("SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1")
            ck_source_id = cur.fetchone()[0]
            
            # 2. Identify the 0-price card printings (from our 57 failing cards in MV)
            cur.execute("""
                SELECT cp.printing_id, c.card_name, cp.set_code, c.card_id
                FROM card_printings cp
                JOIN cards c ON cp.card_id = c.card_id
                WHERE cp.avg_market_price_usd = 0 OR cp.avg_market_price_usd IS NULL
                
                -- Limiting just to those that we know should be fixed
                AND EXISTS (
                    SELECT 1 FROM products p WHERE p.printing_id = cp.printing_id
                )
            """)
            printings = cur.fetchall()
            print(f"Repairing {len(printings)} card printings with 0 price in the catalog using Card Kingdom only...")

            fixed_count = 0
            for pr_id, name, set_code, card_id in printings:
                # Try to find a CK price for this specific printing first
                cur.execute("""
                    SELECT price_usd 
                    FROM price_history 
                    WHERE printing_id = %s AND source_id = %s 
                    ORDER BY timestamp DESC LIMIT 1
                """, (pr_id, ck_source_id))
                row = cur.fetchone()
                
                new_price = None
                if row and row[0] is not None and row[0] > 0:
                    new_price = row[0]
                else:
                    # SMART LOOKUP: Find ANY CK price for this card name
                    cur.execute("""
                        SELECT ph.price_usd, cp2.set_code
                        FROM price_history ph
                        JOIN card_printings cp2 ON ph.printing_id = cp2.printing_id
                        WHERE cp2.card_id = %s AND ph.source_id = %s
                        ORDER BY 
                            CASE WHEN cp2.set_code = %s THEN 0 ELSE 1 END,
                            ph.timestamp DESC 
                        LIMIT 1
                    """, (card_id, ck_source_id, set_code))
                    smart_row = cur.fetchone()
                    if smart_row and smart_row[0] is not None and smart_row[0] > 0:
                        new_price = smart_row[0]
                
                if new_price:
                    # Update card_printings
                    cur.execute("UPDATE card_printings SET avg_market_price_usd = %s WHERE printing_id = %s", (new_price, pr_id))
                    # Also update products, just in case
                    cur.execute("UPDATE products SET price = %s WHERE printing_id = %s AND (price = 0 OR price IS NULL)", (new_price, pr_id))
                    fixed_count += 1
                else:
                    print(f"  [NO DATA] {name} ({set_code}) - Card Kingdom has no price history for this card name.")

            print(f"\nRepair completed. Fixed {fixed_count} out of {len(printings)} card printings.")
            
            # Refresh MV
            print("Refreshing mv_unique_cards...")
            try:
                cur.execute('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unique_cards;')
            except Exception as e:
                conn.rollback()
                cur.execute('REFRESH MATERIALIZED VIEW   mv_unique_cards;')
            print("Done.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    force_ck_repair_card_printings()
