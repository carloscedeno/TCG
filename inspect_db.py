import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def inspect():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("--- Foreign Key for price_history.source_id ---")
    cur.execute("""
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'price_history'
          AND kcu.column_name = 'source_id';
    """)
    print(cur.fetchall())
    
    print("\n--- Tables with 'source' in name ---")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%source%' AND table_schema = 'public'")
    print(cur.fetchall())

    print("\n--- Triggers on price_history ---")
    cur.execute("SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'price_history'")
    print(cur.fetchall())

    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect()
