import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.prod')
DATABASE_URL = os.getenv("DATABASE_URL").replace(".co:6543", ".com:6543")

def reload_schema():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    print("Reloading PostgREST schema cache...")
    cur.execute("NOTIFY pgrst, 'reload schema';")
    print("✅ Schema reloaded.")

if __name__ == "__main__":
    reload_schema()
