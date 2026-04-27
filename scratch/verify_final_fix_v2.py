import os
import psycopg2
from dotenv import load_dotenv

DB_PARAMS = dict(
    user="postgres.sxuotvogwvmxuvwbsscv",
    password="jLta9LqEmpMzCI5r",
    host="aws-0-us-west-2.pooler.supabase.com",
    port="6543",
    dbname="postgres"
)

def verify_fix():
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    
    names = ['Emeritus of Woe', 'Banishing Knack', 'Reflecting Pool', 'Endless Horizons']
    
    for name in names:
        print(f"\nChecking: {name}")
        cur.execute("""
            SELECT cp.avg_market_price_usd, cp.avg_market_price_foil_usd, cp.is_foil, cp.collector_number, s.set_code
            FROM public.card_printings cp
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            WHERE c.card_name = %s
        """, (name,))
        rows = cur.fetchall()
        for res in rows:
            price = res[1] if res[2] else res[0]
            print(f" - Set: {res[4]} | Num: {res[3]} | Foil: {res[2]} | Price: ${price}")
            
    conn.close()

if __name__ == "__main__":
    verify_fix()
