import psycopg2

def check_card_prices(card_name, set_code):
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print(f"--- Diagnóstico de precios para: {card_name} ({set_code}) ---")
        
        query = """
            SELECT 
                cp.printing_id,
                cp.collector_number,
                s.set_code,
                c.card_name,
                ap.avg_market_price_usd,
                ap.avg_market_price_foil_usd,
                ap.buy_price_usd,
                ap.low_price_usd,
                p.price as product_price
            FROM public.card_printings cp
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            LEFT JOIN public.aggregated_prices ap ON cp.printing_id = ap.printing_id
            LEFT JOIN public.products p ON cp.printing_id = p.printing_id
            WHERE c.card_name ILIKE %s
            AND s.set_code = %s;
        """
        cur.execute(query, (card_name, set_code))
        rows = cur.fetchall()
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"Collector: {row[1]}")
            print(f"Set: {row[2]}")
            print(f"Name: {row[3]}")
            print(f"CK (Normal): {row[4]}")
            print(f"CK (Foil): {row[5]}")
            print(f"Mkt (Normal): {row[6]}")
            print(f"Mkt (Foil): {row[7]}")
            print(f"Prod Price: {row[8]}")
            print("-" * 20)
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_card_prices("Sleight of Hand", "soa")
