import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def inspect_schema():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    tables = ['sets', 'card_printings', 'products', 'cards']
    for table in tables:
        print(f"\n--- Columns in {table} ---")
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}' AND table_schema = 'public'")
        cols = cur.fetchall()
        print([c[0] for c in cols])
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_schema()
