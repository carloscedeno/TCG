import psycopg2

def check_price_history_for_card(card_name, set_code, collector_number):
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print(f"--- Price History for {card_name} ({set_code} #{collector_number}) ---")
        
        query = """
            SELECT 
                ph.source_id,
                ph.condition_id,
                ph.is_foil,
                ph.price_usd,
                ph.timestamp,
                ps.source_name
            FROM public.price_history ph
            JOIN public.card_printings cp ON ph.printing_id = cp.printing_id
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            LEFT JOIN public.price_sources ps ON ph.source_id = ps.source_id
            WHERE c.card_name = %s
            AND s.set_code = %s
            AND cp.collector_number = %s
            ORDER BY ph.source_id, ph.is_foil, ph.timestamp DESC;
        """
        cur.execute(query, (card_name, set_code, collector_number))
        rows = cur.fetchall()
        for row in rows:
            print(f"Source: {row[0]} ({row[5]}) | Cond: {row[1]} | Foil: {row[2]} | Price: {row[3]} | TS: {row[4]}")
            
        if not rows:
            print("No history found for this specific card.")

        # Also check if another Sleight of Hand has the 159.99 price
        print("\n--- Any Sleight of Hand with price near 159.99? ---")
        cur.execute("""
            SELECT s.set_code, cp.collector_number, ph.price_usd, ph.is_foil
            FROM public.price_history ph
            JOIN public.card_printings cp ON ph.printing_id = cp.printing_id
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            WHERE c.card_name = 'Sleight of Hand'
            AND ph.price_usd > 100;
        """)
        for row in cur.fetchall():
            print(f"Set: {row[0]} | Col: {row[1]} | Price: {row[2]} | Foil: {row[3]}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_price_history_for_card("Sleight of Hand", "soa", "22")
