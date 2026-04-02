
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def verify_prices():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # 1. Total products with price 0 in products table
            cur.execute("SELECT count(*) FROM products WHERE price = 0")
            count_table = cur.fetchone()[0]
            print(f"Products with price 0 in 'products' table: {count_table}")

            # 2. Check if mv_unique_cards exists
            cur.execute("SELECT count(*) FROM pg_matviews WHERE matviewname = 'mv_unique_cards'")
            if cur.fetchone()[0] > 0:
                cur.execute("SELECT count(*) FROM mv_unique_cards WHERE price = 0")
                count_view = cur.fetchone()[0]
                print(f"Products with price 0 in 'mv_unique_cards' view: {count_view}")
                
                if count_view > count_table:
                    print("DIAGNOSIS: The Materialized View is STALE. It has more 0-price products than the table.")
            else:
                print("mv_unique_cards view does not exist.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_prices()
