import os
import psycopg2
from dotenv import load_dotenv

def run_migration():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found")
        return

    migration_file = "supabase/migrations/20260310_emergency_fix_timeouts.sql"
    
    try:
        with open(migration_file, 'r') as f:
            sql = f.read()
        
        print(f"Connecting to database...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            print(f"Running migration {migration_file}...")
            cur.execute(sql)
            print("Migration successful.")
        conn.close()
    except Exception as e:
        print(f"Error running migration: {e}")

if __name__ == "__main__":
    run_migration()
