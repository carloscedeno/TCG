import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def inspect_printings():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    ids = ('de77686e-c4c1-4d38-a05c-03eb7363fc0b', 'e4b35111-2c74-4dda-b156-d1bf9f3c2947')
    cur.execute("""
        SELECT cp.printing_id, cp.collector_number, cp.avg_market_price_usd, s.set_code, c.card_name
        FROM card_printings cp
        JOIN sets s ON cp.set_id = s.set_id
        JOIN cards c ON cp.card_id = c.card_id
        WHERE cp.printing_id IN %s;
    """, (ids,))
    rows = cur.fetchall()
    print("Printing Inspection:")
    for r in rows:
        print(f"ID: {r[0]}, Num: {r[1]}, Price: {r[2]}, Set: {r[3]}, Name: {r[4]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_printings()
