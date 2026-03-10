import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def verify_latest_updates():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("--- Latest Price Updates for 'Riders of the Mark' (Source 17) ---")
    query = """
        SELECT ph.printing_id, ph.price_usd, ph.timestamp, p.name, cp.collector_number
        FROM public.price_history ph
        JOIN public.card_printings cp ON ph.printing_id = cp.printing_id
        JOIN public.products p ON cp.printing_id = p.printing_id
        WHERE ph.source_id = 17 
        AND p.name ILIKE '%Riders of the Mark%'
        ORDER BY ph.timestamp DESC
        LIMIT 10
    """
    cur.execute(query)
    rows = cur.fetchall()
    if not rows:
        print("No updates found yet for 'Riders of the Mark' in this run.")
    for r in rows:
        print(f"Name: {r[3]} (#{r[4]}), Price: ${r[1]}, Updated: {r[2]}")
        
    print("\n--- Recent Bulk Sync Progress ---")
    cur.execute("SELECT COUNT(*) FROM public.price_history WHERE source_id = 17 AND timestamp > NOW() - INTERVAL '1 hour'")
    count = cur.fetchone()[0]
    print(f"Prices inserted/updated in the last hour: {count}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    verify_latest_updates()
