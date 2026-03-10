import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def deep_check():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    printing_id = 'de77686e-c4c1-4d38-a05c-03eb7363fc0b' # #827 (Riders of the Mark)
    print(f"--- All Price History for Printing {printing_id} (#827) ---")
    cur.execute("SELECT ph.source_id, ph.price_usd, ph.timestamp FROM public.price_history ph WHERE ph.printing_id = %s ORDER BY ph.timestamp DESC LIMIT 10", (printing_id,))
    rows = cur.fetchall()
    for r in rows:
        print(f"Source: {r[0]} | Price: ${r[1]} | Time: {r[2]}")
        
    print("\n--- Summary of Source Table ---")
    cur.execute("SELECT source_id, name FROM public.sources")
    sources = cur.fetchall()
    for s in sources:
        print(f"ID: {s[0]} | Name: {s[1]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    deep_check()
