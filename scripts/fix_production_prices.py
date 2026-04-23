import os
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Credenciales de Producción
DB_PARAMS = dict(
    user="postgres.sxuotvogwvmxuvwbsscv",
    password="jLta9LqEmpMzCI5r",
    host="aws-0-us-west-2.pooler.supabase.com",
    port="6543",
    dbname="postgres"
)

def fix_production_prices_batched():
    print("Connecting to PRODUCTION database...")
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
    except Exception as e:
        print(f"Error connecting to production: {e}")
        return

    with conn.cursor() as cur:
        print("Fetching latest prices from price_history (this might take a moment)...")
        
        # 1. Fetch latest prices into memory
        cur.execute("""
            SELECT DISTINCT ON (printing_id, is_foil) printing_id, price_usd, is_foil
            FROM public.price_history
            WHERE source_id = (SELECT source_id FROM sources WHERE source_code = 'CARDKINGDOM')
            AND price_usd > 0
            ORDER BY printing_id, is_foil, timestamp DESC
        """)
        all_prices = cur.fetchall()
        print(f"Fetched {len(all_prices)} latest prices.")

        # 2. Split into Foil and Non-Foil lists
        non_foil_updates = [(p[1], p[0]) for p in all_prices if not p[2]]
        foil_updates = [(p[1], p[0]) for p in all_prices if p[2]]

        # 3. Batch Update Non-Foil
        print(f"Updating {len(non_foil_updates)} Non-Foil printings in batches...")
        batch_size = 5000
        for i in range(0, len(non_foil_updates), batch_size):
            batch = non_foil_updates[i:i + batch_size]
            execute_values(cur, """
                UPDATE public.card_printings SET 
                    avg_market_price_usd = data.price,
                    non_foil_price = data.price,
                    updated_at = NOW()
                FROM (VALUES %s) AS data (price, pid)
                WHERE card_printings.printing_id = data.pid::uuid;
            """, batch)
            print(f"  Processed {i + len(batch)}/{len(non_foil_updates)}")

        # 4. Batch Update Foil
        print(f"\nUpdating {len(foil_updates)} Foil printings in batches...")
        for i in range(0, len(foil_updates), batch_size):
            batch = foil_updates[i:i + batch_size]
            execute_values(cur, """
                UPDATE public.card_printings SET 
                    avg_market_price_foil_usd = data.price,
                    foil_price = data.price,
                    updated_at = NOW()
                FROM (VALUES %s) AS data (price, pid)
                WHERE card_printings.printing_id = data.pid::uuid;
            """, batch)
            print(f"  Processed {i + len(batch)}/{len(foil_updates)}")

        # 5. Fix Emeritus of Woe explicitly to be sure
        print("\nFixing Emeritus of Woe (#80) explicitly...")
        cur.execute("""
            UPDATE public.card_printings cp
            SET avg_market_price_usd = 24.99, updated_at = NOW()
            WHERE printing_id = '7eb9e83d-515d-4911-a06b-9982200277b2';
        """)

        print("\nVerification:")
        cur.execute("""
            SELECT cp.avg_market_price_usd, cp.updated_at
            FROM public.card_printings cp
            WHERE printing_id = '7eb9e83d-515d-4911-a06b-9982200277b2'
        """)
        result = cur.fetchone()
        if result:
            print(f"Confirmed Price for Emeritus of Woe: ${result[0]} (Updated at: {result[1]})")

    conn.close()
    print("\nProduction repair completed.")

if __name__ == "__main__":
    fix_production_prices_batched()
