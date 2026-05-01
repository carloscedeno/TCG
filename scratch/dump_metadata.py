import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

def dump_metadata():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            print("--- SOURCES ---")
            cur.execute("SELECT * FROM sources")
            for row in cur.fetchall():
                print(row)
            
            print("\n--- GAMES ---")
            cur.execute("SELECT * FROM games")
            for row in cur.fetchall():
                print(row)
            
            print("\n--- RECENT PRICE HISTORY (last 5) ---")
            cur.execute("SELECT ph.*, s.source_code FROM price_history ph JOIN sources s ON ph.source_id = s.source_id ORDER BY ph.timestamp DESC LIMIT 5")
            for row in cur.fetchall():
                print(row)

    finally:
        conn.close()

if __name__ == "__main__":
    dump_metadata()
