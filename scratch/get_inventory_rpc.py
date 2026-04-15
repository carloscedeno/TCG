import os
import psycopg2
from dotenv import load_dotenv

def get_rpc_definition():
    # Load .env from the root
    load_dotenv('e:/TCG Web App/.env')
    
    # Construct DB URL from .env (matching what I saw in the other script)
    db_url = f"postgresql://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('dbname')}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT prosrc 
                FROM pg_proc 
                WHERE proname = 'get_inventory_list';
            """)
            row = cur.fetchone()
            if row:
                print("--- get_inventory_list ---")
                print(row[0])
            else:
                print("RPC 'get_inventory_list' not found.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_rpc_definition()
