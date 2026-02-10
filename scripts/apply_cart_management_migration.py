import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def apply_cart_management_migration():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST') or 'db.sxuotvogwvmxuvwbsscv.supabase.co',
            port=os.getenv('DATABASE_PORT') or '5432',
            user=os.getenv('DATABASE_USER') or 'postgres.sxuotvogwvmxuvwbsscv',
            password=os.getenv('DATABASE_PASSWORD'),
            dbname=os.getenv('DATABASE_NAME') or 'postgres'
        )
        cur = conn.cursor()
        
        # Read the migration file
        migration_file = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations', '20260210_cart_management.sql')
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("Applying cart management migration...")
        cur.execute(migration_sql)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Cart management migration applied successfully!")
        print("   - update_cart_item_quantity() function created")
        print("   - remove_from_cart() function created")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    apply_cart_management_migration()
