import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.prod')

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL is not set.")
    exit(1)

DATABASE_URL = DATABASE_URL.replace(".co:6543", ".com:6543")

import sys
import io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def apply_fixes():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("1. Adding missing additional_images column if not exists...")
        cur.execute("ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT '{}';")
        print("✅ Column added.")
        
        print("2. Dropping ALL overloads of the affected RPCs...")
        drop_overloads_sql = """
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (
                SELECT oid::regprocedure as drop_stmt
                FROM pg_proc
                WHERE proname IN ('get_products_filtered', 'get_accessories_filtered')
                  AND pronamespace = 'public'::regnamespace
            )
            LOOP
                EXECUTE 'DROP FUNCTION IF EXISTS ' || r.drop_stmt || ' CASCADE;';
            END LOOP;
        END;
        $$;
        """
        cur.execute(drop_overloads_sql)
        print("✅ All overloads dropped.")
        
        print("3. Recreating RPCs from 20260521000002_discount_as_label.sql...")
        with open('supabase/migrations/20260521000002_discount_as_label.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        cur.execute(sql)
        print("✅ RPCs recreated.")
        
        print("4. Reloading PostgREST schema cache...")
        cur.execute("NOTIFY pgrst, reload schema;")
        print("✅ Schema reloaded.")
        
        cur.close()
        conn.close()
        print("🎉 SUCCESS! The production database should be fully functional now.")
    except Exception as e:
        print(f"Error applying fixes: {e}")

if __name__ == "__main__":
    apply_fixes()
