
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_production_data():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Check a few records in card_printings
        print("Checking card_printings pricing columns...")
        cur.execute("""
            SELECT printing_id, avg_market_price_usd, avg_market_price_foil_usd 
            FROM card_printings 
            WHERE avg_market_price_usd IS NOT NULL OR avg_market_price_foil_usd IS NOT NULL
            LIMIT 5;
        """)
        rows = cur.fetchall()
        if not rows:
            print("No prices found in card_printings.")
        else:
            for row in rows:
                print(f"ID: {row[0]}, Price: {row[1]}, Foil Price: {row[2]}")
        
        # Check MV columns
        print("\nChecking mv_unique_cards columns...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'mv_unique_cards';
        """)
        mv_cols = [r[0] for r in cur.fetchall()]
        print(f"MV Columns: {mv_cols}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_production_data()
