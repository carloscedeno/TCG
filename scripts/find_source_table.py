import os
import psycopg2
from dotenv import load_dotenv

def find_table():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # List all tables in all schemas
    cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%source%'")
    print("Tables with 'source' in name:", cur.fetchall())
    
    # Check public.sources
    try:
        cur.execute("SELECT * FROM public.sources LIMIT 1")
        print("Success reading public.sources")
    except:
        conn.rollback()
        print("Failed reading public.sources")
        
    # Check public.price_sources
    try:
        cur.execute("SELECT * FROM public.price_sources LIMIT 1")
        print("Success reading public.price_sources")
    except:
        conn.rollback()
        print("Failed reading public.price_sources")

    conn.close()

if __name__ == "__main__":
    find_table()
