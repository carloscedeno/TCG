
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def view_def():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("SELECT pg_get_viewdef('mv_unique_cards');")
            view_definition = cur.fetchone()[0]
            print(view_definition)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    view_def()
