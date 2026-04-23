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
    
    cards_to_check = [
        ('Emeritus of Woe', '80'),
        ('Banishing Knack', '80'),
        ('Reflecting Pool', '118'),
        ('Endless Horizons', '101')
    ]
    
    print(f"{'Card Name':<30} | {'Num':<5} | {'Price DB':<8}")
    print("-" * 50)
    
    for name, num in cards_to_check:
        cur.execute("""
            SELECT cp.avg_market_price_usd, cp.avg_market_price_foil_usd, cp.is_foil
            FROM public.card_printings cp
            JOIN public.cards c ON cp.card_id = c.card_id
            WHERE c.card_name = %s AND cp.collector_number = %s
        """, (name, num))
        res = cur.fetchone()
        if res:
            price = res[1] if res[2] else res[0]
            print(f"{name:<30} | {num:<5} | ${price:<8.2f}")
        else:
            print(f"{name:<30} | {num:<5} | NOT FOUND")
            
    conn.close()

if __name__ == "__main__":
    verify_fix()
