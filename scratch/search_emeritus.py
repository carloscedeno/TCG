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
    
    cur.execute("""
        SELECT cp.printing_id, cp.avg_market_price_usd, s.set_code, cp.collector_number
        FROM public.card_printings cp
        JOIN public.cards c ON cp.card_id = c.card_id
        JOIN public.sets s ON cp.set_id = s.set_id
        WHERE c.card_name ILIKE '%Emeritus of Woe%'
    """)
    rows = cur.fetchall()
    print("Found printings for Emeritus of Woe in Production:")
    for row in rows:
        print(f" - ID: {row[0]} | Price: {row[1]} | Set: {row[2]} | Num: {row[3]}")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
