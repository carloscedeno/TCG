import os
import psycopg2
from dotenv import load_dotenv

def get_rpc_defs():
    load_dotenv('e:/TCG Web App/.env')
    db_url = f"postgresql://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('dbname')}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            for name in ['get_inventory_list', 'get_products_filtered']:
                cur.execute("SELECT prosrc FROM pg_proc WHERE proname = %s", (name,))
                row = cur.fetchone()
                if row:
                    print(f"--- {name} ---")
                    print(row[0])
                    print("\n" + "="*50 + "\n")
        conn.close()
    except Exception as e:
        print(f"Error fetching RPCs: {e}")

if __name__ == "__main__":
    get_rpc_defs()
