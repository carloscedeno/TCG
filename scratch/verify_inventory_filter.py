import os
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

def verify_new_filter():
    load_dotenv('e:/TCG Web App/.env')
    db_url = f"postgresql://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('dbname')}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # 1. Check current latest items
            cur.execute("SELECT name, created_at FROM products ORDER BY created_at DESC LIMIT 3")
            latest = cur.fetchall()
            print(f"Current Latest: {latest}")

            # 2. Test RPC without filter
            cur.execute("SELECT name, created_at FROM get_inventory_list(0, 5, NULL, NULL, NULL, NULL, 'name', 'asc', FALSE)")
            res_all = cur.fetchall()
            print(f"RPC (All): {len(res_all)} items returned")

            # 3. Test RPC with 'only_new' filter
            cur.execute("SELECT name, created_at FROM get_inventory_list(0, 5, NULL, NULL, NULL, NULL, 'name', 'asc', TRUE)")
            res_new = cur.fetchall()
            print(f"RPC (Only New): {len(res_new)} items returned")
            if res_new:
                print(f"First 3 new items: {res_new[:3]}")
                
        conn.close()
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_new_filter()
