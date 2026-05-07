import os
import psycopg2
from urllib.parse import urlparse

# Try to load from .env.dev if available
db_url = os.environ.get('DATABASE_URL_POOLER') or os.environ.get('DATABASE_URL')
if not db_url and os.path.exists('.env.dev'):
    with open('.env.dev', 'r') as f:
        for line in f:
            if line.startswith('DATABASE_URL_POOLER='):
                db_url = line.split('=', 1)[1].strip()
                break
            elif not db_url and line.startswith('DATABASE_URL='):
                db_url = line.split('=', 1)[1].strip()

if db_url and '?' in db_url:
    db_url = db_url.split('?')[0]

if not db_url:
    print("DATABASE_URL not found")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("--- Table: order_items ---")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items'")
    for row in cur.fetchall():
        print(f"{row[0]}: {row[1]}")
        
    print("\n--- Constraints on products.stock ---")
    cur.execute("""
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'public.products'::regclass AND 'stock' = ANY(
            SELECT attname FROM pg_attribute WHERE attrelid = 'public.products'::regclass AND attnum = ANY(conkey)
        )
    """)
    for row in cur.fetchall():
        print(f"{row[0]}: {row[1]}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
