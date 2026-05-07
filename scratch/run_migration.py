import os
import psycopg2

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

migration_file = 'supabase/migrations/20260507120000_allow_on_demand_and_labels.sql'

try:
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    print(f"Executing migration: {migration_file}...")
    cur.execute(sql)
    print("Migration executed successfully.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
