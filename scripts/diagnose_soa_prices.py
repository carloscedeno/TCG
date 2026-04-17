import psycopg2

def check_set_prices(set_code):
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print(f"--- Precios para el set: {set_code} ---")
        
        query = """
            SELECT 
                cp.collector_number,
                c.card_name,
                ap.avg_market_price_usd,
                ap.low_price_usd,
                p.price as product_price
            FROM public.card_printings cp
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            LEFT JOIN public.aggregated_prices ap ON cp.printing_id = ap.printing_id
            LEFT JOIN public.products p ON cp.printing_id = p.printing_id
            WHERE s.set_code = %s
            AND (ap.avg_market_price_usd > 50 OR p.price > 50)
            ORDER BY ap.avg_market_price_usd DESC;
        """
        cur.execute(query, (set_code,))
        rows = cur.fetchall()
        for row in rows:
            print(f"Col: {row[0]} | Name: {row[1]} | Mkt: {row[2]} | Low: {row[3]} | Prod: {row[4]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_set_prices("soa")
