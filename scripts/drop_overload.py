import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.prod')
DATABASE_URL = os.getenv("DATABASE_URL").replace(".co:6543", ".com:6543")

def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute("DROP FUNCTION IF EXISTS public.get_products_filtered(text, text, text[], text[], text[], text[], integer, integer, numeric, numeric, integer, integer, boolean, text, text[], boolean, boolean) CASCADE;")
    print("Dropped 17-param version.")
    
    cur.execute("NOTIFY pgrst, 'reload schema';")
    print("Schema reloaded.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    run()
