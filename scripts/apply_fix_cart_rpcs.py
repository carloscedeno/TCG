import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    # Add sslmode if not present
    if 'sslmode' not in db_url:
        if '?' in db_url:
            db_url += '&sslmode=require'
        else:
            db_url += '?sslmode=require'

    try:
        print("Connecting to database...")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        migration_path = os.path.join('supabase', 'migrations', '20260424000000_recreate_cart_management_rpcs.sql')
        with open(migration_path, 'r') as f:
            sql = f.read()
            
        print(f"Applying migration from {migration_path}...")
        cur.execute(sql)
        conn.commit()
        
        print("✅ Migration applied successfully!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        print("\nIf connectivity fails, please run the SQL in supabase/migrations/20260424000000_recreate_cart_management_rpcs.sql manually in the Supabase Dashboard.")

if __name__ == "__main__":
    apply_migration()
