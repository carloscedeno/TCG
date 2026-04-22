import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

DATABASE_URL = "postgresql://postgres:jLta9LqEmpMzCI5r@db.bqfkqnnostzaqueujdms.supabase.co:5432/postgres?sslmode=require"

def apply_sql_file(conn, filepath):
    print(f"Applying {filepath}...")
    if not os.path.exists(filepath):
        print(f"  Error: File not found: {filepath}")
        return False
        
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    with conn.cursor() as cur:
        try:
            cur.execute(sql)
            conn.commit()
            print("  Success!")
            return True
        except Exception as e:
            conn.rollback()
            print(f"  Error applying {filepath}: {e}")
            return False

def main():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    # Use port 5432 with sslmode=require as first try
    url = DATABASE_URL
    if 'sslmode' not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"

    print(f"Connecting to: {url.split('@')[-1]}")
    try:
        conn = psycopg2.connect(url)
        print("Connected to database.")
    except Exception as e:
        print(f"Failed to connect (5432): {e}")
        # Try port 6543
        if "5432" in url:
            print("Trying port 6543...")
            url = url.replace(":5432", ":6543")
            try:
                conn = psycopg2.connect(url)
                print("Connected to database on port 6543.")
            except Exception as e2:
                print(f"Failed to connect (6543): {e2}")
                return
        else:
            return

    steps = [
        'supabase/initialize_dev.sql',
        'supabase/consolidated_schema.sql',
        'supabase/migrations/20260421000000_create_accessories_module.sql',
        'supabase/migrations/20260421000001_cart_accessory_support.sql'
    ]

    success = True
    for m in steps:
        path = os.path.join(os.getcwd(), m)
        if not apply_sql_file(conn, path):
            success = False
            print(f"Stopping due to error in {m}")
            break

    conn.close()
    if success:
        print("\nDATABASE REPAIR COMPLETED SUCCESSFULLY.")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
