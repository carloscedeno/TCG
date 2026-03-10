import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def inspect_table(table_name):
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}' ORDER BY ordinal_position;")
    columns = cur.fetchall()
    print(f"\n--- {table_name} Columns ---")
    for col in columns:
        print(f"{col[0]} ({col[1]})")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect_table("card_printings")
    inspect_table("products")
    inspect_table("cards")
    inspect_table("sets")
