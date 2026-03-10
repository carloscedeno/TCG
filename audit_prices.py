import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def audit():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    printing_id = 'de77686e-c4c1-4d38-a05c-03eb7363fc0b' # #827 (Riders of the Mark Borderless)
    print(f"--- Global Price History for Printing {printing_id} ---")
    cur.execute("SELECT source_id, price_usd, timestamp FROM public.price_history WHERE printing_id = %s ORDER BY timestamp DESC LIMIT 20", (printing_id,))
    rows = cur.fetchall()
    for r in rows:
        print(f"Source: {r[0]} | Price: ${r[1]} | Time: {r[2]}")
        
    print("\n--- Listing Sources ---")
    cur.execute("SELECT source_id, name FROM public.sources")
    for s in cur.fetchall():
        print(f"ID: {s[0]} | Name: {s[1]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    audit()
