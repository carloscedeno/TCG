
import os
import psycopg2
from dotenv import load_dotenv

def get_env():
    load_dotenv()
    return os.getenv('DATABASE_URL')

def research():
    db_url = get_env()
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # 1. Total products with price 0
            cur.execute("SELECT count(*) FROM public.products WHERE price = 0")
            print(f"Products with price 0: {cur.fetchone()[0]}")

            # 2. Sample 0-price products
            cur.execute("""
                SELECT name, set_code, printing_id 
                FROM public.products 
                WHERE price = 0 
                LIMIT 5
            """)
            samples = cur.fetchall()
            print("\nSamples of products with price 0:")
            for s in samples:
                p_id = s[2]
                # Check price_history for this printing
                cur.execute("SELECT count(*) FROM public.price_history WHERE printing_id = %s", (p_id,))
                hist_count = cur.fetchone()[0]
                
                # Check CardKingdom specificaly
                cur.execute("""
                    SELECT ph.price_usd, ph.timestamp 
                    FROM public.price_history ph
                    JOIN public.price_sources ps ON ph.source_id = ps.source_id
                    WHERE ph.printing_id = %s AND UPPER(ps.source_code) = 'CARDKINGDOM'
                    ORDER BY ph.timestamp DESC LIMIT 1
                """, (p_id,))
                ck_hist = cur.fetchone()
                ck_val = ck_hist[0] if ck_hist else "N/A"

                print(f"  - {s[0]} ({s[1]}): History Count: {hist_count}, Latest CK Price: {ck_val}")

            # 3. Check for aggregated_prices table
            cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'aggregated_prices')")
            if cur.fetchone()[0]:
                cur.execute("SELECT count(*) FROM public.aggregated_prices")
                print(f"\naggregated_prices exists, count: {cur.fetchone()[0]}")
            else:
                # Check for table scryfall_prices or similar
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%scryfall%'")
                print(f"\nScryfall related tables: {[r[0] for r in cur.fetchall()]}")

            # 4. Check card_printings denormalized prices
            cur.execute("SELECT count(*) FROM public.card_printings WHERE avg_market_price_usd = 0 OR avg_market_price_usd IS NULL")
            print(f"\nCard Printings with 0 market price: {cur.fetchone()[0]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    research()
