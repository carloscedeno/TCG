import os
import psycopg2
from dotenv import load_dotenv

def debug():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("--- Price History Counts by Source ID ---")
    cur.execute("""
        SELECT ph.source_id, s.source_code, COUNT(*) 
        FROM price_history ph
        LEFT JOIN sources s ON ph.source_id = s.source_id
        GROUP BY ph.source_id, s.source_code
        ORDER BY count DESC
    """)
    for row in cur.fetchall():
        print(row)

    print("\n--- Card Printings Pricing Status ---")
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(avg_market_price_usd) as with_price,
            COUNT(*) FILTER (WHERE avg_market_price_usd = 0) as zeros,
            COUNT(*) FILTER (WHERE avg_market_price_usd IS NULL) as nulls
        FROM card_printings
    """)
    print(cur.fetchone())

    conn.close()

if __name__ == "__main__":
    debug()
