import os
import sys
import psycopg2
from dotenv import load_dotenv

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
            # Also notify postgrest!
            cur.execute("NOTIFY pgrst, 'reload schema';")
            conn.commit()
            print("  Success applying and reloading schema!")
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

    filepath = sys.argv[1] if len(sys.argv) > 1 else 'supabase/migrations/20260311200000_add_finish_to_products_filtered.sql'
    
    path = os.path.join(os.getcwd(), filepath)
    if os.path.exists(path):
        try:
            apply_sql_file(conn, path)
        except:
            print("Stopping due to error.")
    else:
        print(f"File not found: {path}")

    conn.close()

if __name__ == "__main__":
    main()
