import os
import sys
import psycopg2
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def test_rpc():
    conn = psycopg2.connect(DATABASE_URL)
    with conn.cursor() as cur:
        # call the RPC
        cur.execute("""
            SELECT name, set_code, finish, price, stock, printing_id 
            FROM public.get_products_filtered(search_query := 'Chandra''s Fury');
        """)
        rows = cur.fetchall()
        for r in rows:
            print(r)
    conn.close()

if __name__ == '__main__':
    test_rpc()
