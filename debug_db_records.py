import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def debug_db_records():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("--- Searching for Collector Number '827' ---")
    cur.execute("SELECT printing_id, set_id, collector_number, avg_market_price_usd FROM card_printings WHERE collector_number = '827' LIMIT 10;")
    rows = cur.fetchall()
    for r in rows:
        print(f"Printing ID: {r[0]}, Set ID: {r[1]}, Num: {r[2]}, Price: {r[3]}")
        
    print("\n--- Searching for Set Name like 'Lord of the Rings' ---")
    cur.execute("SELECT set_id, set_name, set_code FROM sets WHERE set_name ILIKE '%Lord of the Rings%' LIMIT 10;")
    sets = cur.fetchall()
    for s in sets:
        print(f"Set ID: {s[0]}, Name: {s[1]}, Code: {s[2]}")

    print("\n--- Searching for Product Name like 'Riders of the Mark' ---")
    cur.execute("SELECT id, name, price, printing_id FROM products WHERE name ILIKE '%Riders of the Mark%' LIMIT 10;")
    products = cur.fetchall()
    for p in products:
        print(f"Product ID: {p[0]}, Name: {p[1]}, Price: {p[2]}, Printing ID: {p[3]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    debug_db_records()
