import os
import psycopg2
from dotenv import load_dotenv

# Credenciales de Producción
DB_PARAMS = dict(
    user="postgres.sxuotvogwvmxuvwbsscv",
    password="jLta9LqEmpMzCI5r",
    host="aws-0-us-west-2.pooler.supabase.com",
    port="6543",
    dbname="postgres"
)

def sync_store_with_market_prices_v2():
    print("Connecting to PRODUCTION database for full inventory sync (v2)...")
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
    except Exception as e:
        print(f"Error connecting to production: {e}")
        return

    with conn.cursor() as cur:
        print("Synchronizing ALL product prices with Market prices (safe mode)...")
        
        # Update products table to match card_printings prices
        # We use a WHERE clause to ensure we only update if we have a valid price > 0
        cur.execute("""
            UPDATE public.products p
            SET 
                price = CASE 
                    WHEN p.finish = 'foil' THEN COALESCE(cp.avg_market_price_foil_usd, cp.avg_market_price_usd)
                    ELSE COALESCE(cp.avg_market_price_usd, cp.avg_market_price_foil_usd)
                END,
                updated_at = NOW()
            FROM public.card_printings cp
            WHERE p.printing_id = cp.printing_id
            AND (
                CASE 
                    WHEN p.finish = 'foil' THEN COALESCE(cp.avg_market_price_foil_usd, cp.avg_market_price_usd)
                    ELSE COALESCE(cp.avg_market_price_usd, cp.avg_market_price_foil_usd)
                END
            ) IS NOT NULL
            AND (
                CASE 
                    WHEN p.finish = 'foil' THEN COALESCE(cp.avg_market_price_foil_usd, cp.avg_market_price_usd)
                    ELSE COALESCE(cp.avg_market_price_usd, cp.avg_market_price_foil_usd)
                END
            ) > 0
            AND p.price IS DISTINCT FROM (
                CASE 
                    WHEN p.finish = 'foil' THEN COALESCE(cp.avg_market_price_foil_usd, cp.avg_market_price_usd)
                    ELSE COALESCE(cp.avg_market_price_usd, cp.avg_market_price_foil_usd)
                END
            );
        """)
        print(f"Inventory sync completed: {cur.statusmessage}")

        print("\nVerifying Witherbloom, the Balancer #245...")
        cur.execute("""
            SELECT p.price, cp.avg_market_price_usd
            FROM public.products p
            JOIN public.card_printings cp ON p.printing_id = cp.printing_id
            JOIN public.cards c ON cp.card_id = c.card_id
            WHERE c.card_name ILIKE '%Witherbloom, the Balancer%' AND cp.collector_number LIKE '%245%'
        """)
        result = cur.fetchone()
        if result:
            print(f"Store Price: ${result[0]} | Market Price: ${result[1]}")
            if result[0] == result[1]:
                print("✅ Prices are now EQUAL.")
            else:
                print("❌ Prices are still DIFFERENT.")

    conn.close()
    print("\nFull Production inventory synchronization completed (v2).")

if __name__ == "__main__":
    sync_store_with_market_prices_v2()
