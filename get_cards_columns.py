import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_columns():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM cards LIMIT 1")
    colnames = [desc[0] for desc in cur.description]
    print('cards columns:', colnames)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    get_columns()
