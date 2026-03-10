import os
import psycopg2
from dotenv import load_dotenv

def verify():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("--- Conditions ---")
    cur.execute("SELECT condition_id, condition_code FROM public.conditions")
    print(cur.fetchall())

    print("\n--- price_history Schema ---")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'price_history'")
    for r in cur.fetchall():
        print(f"Column: {r[0]}, Type: {r[1]}")

    print("\n--- card_printings Schema ---")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'card_printings'")
    for r in cur.fetchall():
        print(f"Column: {r[0]}, Type: {r[1]}")
        
    conn.close()

if __name__ == "__main__":
    verify()
