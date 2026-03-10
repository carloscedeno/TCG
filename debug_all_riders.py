import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def find_all_riders():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    query = """
    SELECT p.id, p.name, p.price, p.printing_id, s.set_name, cp.collector_number
    FROM products p
    LEFT JOIN card_printings cp ON p.printing_id = cp.printing_id
    LEFT JOIN sets s ON cp.set_id = s.set_id
    WHERE p.name ILIKE '%Riders of the Mark%';
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    print("All 'Riders of the Mark' entries in products table:")
    for r in rows:
        print(f"Product ID: {r[0]}, Name: {r[1]}, Price: {r[2]}, Printing ID: {r[3]}, Set: {r[4]}, Num: {r[5]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    find_all_riders()
