import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

def debug_card_price():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            print("--- Card Printings for 'Witherbloom, the Balancer' ---")
            cur.execute("""
                SELECT cp.printing_id, cp.scryfall_id, cp.set_code, cp.collector_number, cp.avg_market_price_usd, cp.avg_market_price_foil_usd
                FROM card_printings cp
                JOIN cards c ON cp.card_id = c.card_id
                WHERE c.card_name = 'Witherbloom, the Balancer'
            """)
            printings = cur.fetchall()
            for p in printings:
                print(p)
                
                print(f"\n--- Price History for {p['printing_id']} ---")
                cur.execute("""
                    SELECT ph.*, s.source_code 
                    FROM price_history ph 
                    JOIN sources s ON ph.source_id = s.source_id 
                    WHERE ph.printing_id = %s 
                    ORDER BY ph.timestamp DESC LIMIT 3
                """, (p['printing_id'],))
                for ph in cur.fetchall():
                    print(ph)

    finally:
        conn.close()

if __name__ == "__main__":
    debug_card_price()
