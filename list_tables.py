import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def list_tables():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    """)
    tables = cur.fetchall()
    print("Public Tables:")
    for t in tables:
        print(f"- {t[0]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    list_tables()
