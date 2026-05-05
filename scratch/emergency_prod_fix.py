import os
import sys
import psycopg2
from datetime import datetime, timezone

# PROD DB URL
PROD_DB = "os.getenv("DATABASE_URL_PROD")"

def emergency_fix():
    print("Connecting to PRODUCTION database for emergency pricing fix...")
    try:
        conn = psycopg2.connect(PROD_DB)
        with conn.cursor() as cur:
            # 1. Update Witherbloom, the Balancer (#245 SOS) to $15.99
            # First find the printing_id
            cur.execute("""
                SELECT cp.printing_id 
                FROM card_printings cp 
                JOIN cards c ON cp.card_id = c.card_id 
                WHERE c.card_name = 'Witherbloom, the Balancer' AND cp.collector_number = '245'
            """)
            row = cur.fetchone()
            if not row:
                print("Card not found!")
                return
            printing_id = row[0]
            print(f"Found Printing ID: {printing_id}")

            # 2. Insert into price_history
            # NM Condition ID is 16
            # CK Source ID is 17
            cur.execute("""
                INSERT INTO public.price_history (printing_id, source_id, condition_id, price_usd, is_foil, timestamp, price_type)
                VALUES (%s, 17, 16, 15.99, FALSE, %s, 'retail')
            """, (printing_id, datetime.now(timezone.utc)))
            print("Inserted price history entry.")

            # 3. Update card_printings
            cur.execute("""
                UPDATE card_printings 
                SET avg_market_price_usd = 15.99, non_foil_price = 15.99 
                WHERE printing_id = %s
            """, (printing_id,))
            print("Updated card_printings.")

            # 4. Update products
            cur.execute("""
                UPDATE products 
                SET price = 15.99, price_usd = 15.99 
                WHERE printing_id = %s
            """, (printing_id,))
            print("Updated products.")

            # 5. Refresh Materialized Views (Crucial for frontend!)
            print("Refreshing Materialized Views...")
            cur.execute("REFRESH MATERIALIZED VIEW mv_unique_cards")
            print("Materialized views refreshed.")

            conn.commit()
            print("✅ EMERGENCY FIX COMPLETED SUCCESSFULLY.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    emergency_fix()
