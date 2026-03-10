import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def inspect_price_history():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'price_history' 
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print("Columns in price_history:")
    for c in cols:
        print(f"- {c[0]} ({c[1]})")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_price_history()
