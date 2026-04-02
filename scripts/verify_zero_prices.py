
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def verify_zero_prices():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mv_unique_cards'")
            cols = [r[0] for r in cur.fetchall()]
            
            price_col = 'price' if 'price' in cols else 'min_price' if 'min_price' in cols else 'avg_market_price_usd'
            print(f"Price column in view: {price_col}")
            
            if price_col in cols:
                cur.execute(f"SELECT count(*) FROM mv_unique_cards WHERE {price_col} = 0")
                print(f"Products with {price_col} 0 in Materialized View: {cur.fetchone()[0]}")
            
            cur.execute("SELECT count(*) FROM products WHERE price = 0")
            print(f"Products with price 0 in products table: {cur.fetchone()[0]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_zero_prices()
