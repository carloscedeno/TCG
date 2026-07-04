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
        cur = conn.cursor()
        
        print("Dropping broken overloaded RPCs...")
        drops = """
DROP FUNCTION IF EXISTS public.get_products_filtered(text, text, text[], text[], text[], text[], integer, integer, numeric, numeric, integer, integer, boolean, text);
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer, text, text, text, text, numeric, numeric, text, integer, integer);
"""
        cur.execute(drops)
        print("✅ Dropped old broken RPCs.")
        
        print("Reading migration 20260521000002_discount_as_label.sql...")
        with open('supabase/migrations/20260521000002_discount_as_label.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
            
        print("Executing migration...")
        cur.execute(sql)
        print("✅ Restored production RPCs from 20260521000002_discount_as_label.sql.")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Successfully applied fixes!")
    except Exception as e:
        print(f"Error applying fixes: {e}")

if __name__ == "__main__":
    apply_fixes()
