import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def final_verify():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("--- Detailed Check for Collector Number '827' ---")
    query = """
        SELECT 
            cp.printing_id, 
            p.name, 
            cp.set_code, 
            ph.price_usd, 
            ph.timestamp, 
            ph.source_id,
            p.price as product_table_price
        FROM public.card_printings cp
        JOIN public.products p ON cp.printing_id = p.printing_id
        LEFT JOIN public.price_history ph ON cp.printing_id = ph.printing_id
        WHERE cp.collector_number = '827'
        AND ph.source_id = 17
        ORDER BY ph.timestamp DESC
    """
    cur.execute(query)
    rows = cur.fetchall()
    for r in rows:
        print(f"Printing: {r[0]} | Name: {r[1]} | Set: {r[2]} | Price: ${r[3]} | Time: {r[4]} | Src: {r[5]} | ProdTable: ${r[6]}")
        
    print("\n--- Detailed Check for Collector Number '093' ---")
    cur.execute(query.replace("'827'", "'093'"))
    rows = cur.fetchall()
    for r in rows:
        print(f"Printing: {r[0]} | Name: {r[1]} | Set: {r[2]} | Price: ${r[3]} | Time: {r[4]} | Src: {r[5]} | ProdTable: ${r[6]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    final_verify()
