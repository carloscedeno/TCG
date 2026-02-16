import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def apply_sql_file(conn, filepath):
    print(f"Applying {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    with conn.cursor() as cur:
        try:
            cur.execute(sql)
            conn.commit()
            print("  Success!")
        except Exception as e:
            conn.rollback()
            print(f"  Error applying {filepath}: {e}")
            raise e

def main():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected to database.")
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return

    migrations = [
        'supabase/migrations/20260216_alter_orders_add_columns.sql',
        'supabase/migrations/20260216_create_order_atomic_rpc.sql'
    ]

    for m in migrations:
        path = os.path.join(os.getcwd(), m)
        if os.path.exists(path):
            try:
                apply_sql_file(conn, path)
            except:
                print("Stopping due to error.")
                break
        else:
            print(f"File not found: {path}")

    conn.close()

if __name__ == "__main__":
    main()
