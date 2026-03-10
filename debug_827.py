import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def find_all_827():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    query = """
    SELECT 
        cp.printing_id, 
        c.card_name, 
        s.set_name, 
        s.set_code, 
        cp.collector_number,
        cp.avg_market_price_usd
    FROM card_printings cp
    JOIN sets s ON cp.set_id = s.set_id
    JOIN cards c ON cp.card_id = c.card_id
    WHERE cp.collector_number = '827';
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    print("All Cards with Collector Number 827:")
    for r in rows:
        print(f"Name: {r[1]}, Set: {r[2]} ({r[3]}), Price: {r[5]}, ID: {r[0]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    find_all_827()
