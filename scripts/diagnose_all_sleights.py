import psycopg2

def check_all_sleight_of_hands():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("--- All Sleight of Hand printings and their prices ---")
        
        query = """
            SELECT 
                s.set_code,
                cp.collector_number,
                cp.avg_market_price_usd,
                cp.avg_market_price_foil_usd,
                cp.non_foil_price,
                cp.foil_price
            FROM public.card_printings cp
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            WHERE c.card_name = 'Sleight of Hand'
            ORDER BY s.set_code, cp.collector_number;
        """
        cur.execute(query)
        rows = cur.fetchall()
        for row in rows:
            print(f"Set: {row[0]} | Col: {row[1]} | Normal: {row[2]} | Foil: {row[3]} | NF_P: {row[4]} | F_P: {row[5]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_all_sleight_of_hands()
