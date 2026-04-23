import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    conn = psycopg2.connect(
        user="postgres.sxuotvogwvmxuvwbsscv",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    cur = conn.cursor()
    
    # Count printings where is_foil does not match price_history is_foil
    cur.execute("""
        SELECT count(distinct cp.printing_id)
        FROM public.card_printings cp
        JOIN public.price_history ph ON cp.printing_id = ph.printing_id
        WHERE cp.is_foil != ph.is_foil
    """)
    print("Printings with mismatched foil prices:", cur.fetchone()[0])
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
