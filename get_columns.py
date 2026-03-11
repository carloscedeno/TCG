import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_columns():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'card_printings'")
    columns = [row[0] for row in cur.fetchall()]
    print(f"Columns in card_printings: {columns}")
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = [row[0] for row in cur.fetchall()]
    print(f"Tables in public: {tables}")

    conn.close()

if __name__ == "__main__":
    get_columns()
