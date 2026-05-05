import os
import sys
import psycopg2
from datetime import datetime, timezone

# PROD DB URL
PROD_DB = "os.getenv("DATABASE_URL_PROD")"

def emergency_fix():
    print("Connecting to PRODUCTION database...")
    try:
        conn = psycopg2.connect(PROD_DB)
        with conn.cursor() as cur:
            # Card: Witherbloom, the Balancer (#245 SOS)
            pid = 'ed7b2361-97c6-49e2-bf0b-4770f4ffe2f0'
            price = 15.99
            
            print(f"Updating ID {pid} to {price}...")
            
            # 1. Price History
            cur.execute("""
                INSERT INTO public.price_history (printing_id, source_id, condition_id, price_usd, is_foil, timestamp, price_type)
                VALUES (%s, 17, 16, %s, FALSE, %s, 'retail')
            """, (pid, price, datetime.now(timezone.utc)))
            print("  - Price history entry added.")

            # 2. Card Printings
            cur.execute("""
                UPDATE card_printings 
                SET avg_market_price_usd = %s, non_foil_price = %s 
                WHERE printing_id = %s
            """, (price, price, pid))
            print(f"  - Card printings updated ({cur.rowcount} rows).")

            # 3. Products
            cur.execute("""
                UPDATE products 
                SET price = %s, price_usd = %s 
                WHERE printing_id = %s
            """, (price, price, pid))
            print(f"  - Products updated ({cur.rowcount} rows).")

            conn.commit()
            print("COMMIT SUCCESSFUL.")

            # 4. Try Refresh (Optional)
            try:
                print("Attempting to refresh view...")
                # Use a smaller view or just wait
                cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unique_cards")
                conn.commit()
                print("  - Materialized view refreshed.")
            except Exception as e:
                print(f"  - View refresh failed (but data is committed): {e}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    emergency_fix()
