import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure we load environment
load_dotenv('.env.dev')
load_dotenv('.env')

sys.path.append('.')
sys.path.append('scripts/sync')
from common.db import get_db_connection

migration_file = Path('supabase/migrations/20261106150000_add_sortswift_and_physical_location_fields.sql')
print(f"Reading migration: {migration_file.name}")
sql = migration_file.read_text(encoding='utf-8')

conn = get_db_connection()
conn.autocommit = True
cur = conn.cursor()

print("Applying migration to DEV database...")
cur.execute(sql)
print("Migration executed successfully!")

print("Reloading PostgREST schema cache...")
cur.execute("NOTIFY pgrst, 'reload schema';")
print("PostgREST schema cache reloaded!")

# Verify columns
cur.execute("""
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'products'
      AND column_name IN ('physical_location', 'sortswift_id', 'cost', 'barcode', 'language')
    ORDER BY column_name;
""")
rows = cur.fetchall()
print("\nVerified Columns in products table:")
for r in rows:
    print(f"  - {r[0]}: {r[1]} (default: {r[2]})")

cur.close()
conn.close()
