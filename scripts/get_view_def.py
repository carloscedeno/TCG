
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_view_def():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()

        cur.execute("SELECT pg_get_viewdef('public.mv_unique_cards', true);")
        view_def = cur.fetchone()[0]
        print(view_def)

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_view_def()
