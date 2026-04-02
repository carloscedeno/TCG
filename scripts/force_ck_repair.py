
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def force_ck_repair():
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
            
            # 2. Identify the 0-price products
            cur.execute("""
                SELECT p.id, p.name, p.set_code, p.printing_id, cp.card_id
                FROM products p
                JOIN card_printings cp ON p.printing_id = cp.printing_id
                WHERE p.price = 0
            """)
            products = cur.fetchall()
            print(f"Repairing {len(products)} products with 0 price using Card Kingdom only...")

            fixed_count = 0
            for p_id, name, set_code, pr_id, card_id in products:
                # Try to find a CK price for this specific printing first
                cur.execute("""
                    SELECT price_usd 
                    FROM price_history 
                    WHERE printing_id = %s AND source_id = %s 
                    ORDER BY timestamp DESC LIMIT 1
                """, (pr_id, ck_source_id))
                row = cur.fetchone()
                
                if row and row[0] > 0:
                    new_price = row[0]
                    print(f"  [EXACT MATCH] {name} ({set_code}) -> ${new_price}")
                else:
                    # SMART LOOKUP: Find ANY CK price for this card name
                    cur.execute("""
                        SELECT ph.price_usd, cp.set_code
                        FROM price_history ph
                        JOIN card_printings cp ON ph.printing_id = cp.printing_id
                        WHERE cp.card_id = %s AND ph.source_id = %s
                        ORDER BY 
                            CASE WHEN cp.set_code = %s THEN 0 ELSE 1 END,
                            ph.timestamp DESC 
                        LIMIT 1
                    """, (card_id, ck_source_id, set_code))
                    smart_row = cur.fetchone()
                    if smart_row and smart_row[0] > 0:
                        new_price = smart_row[0]
                        print(f"  [SMART MATCH] {name} ({set_code}) using CK price from {smart_row[1]} -> ${new_price}")
                    else:
                        print(f"  [NO DATA] {name} ({set_code}) - Card Kingdom has no price history for this card name.")
                        continue

                # Perform the update
                cur.execute("UPDATE products SET price = %s WHERE id = %s", (new_price, p_id))
                fixed_count += 1

            print(f"\nRepair completed. Fixed {fixed_count} out of {len(products)} products.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    force_ck_repair()
