import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def main():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("DATABASE_URL not found")
        return

    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    print("Updating card_printings.avg_market_price_usd with Card Kingdom NM prices...")
    cur.execute("""
        UPDATE public.card_printings cp
        SET avg_market_price_usd = (
            SELECT price_usd 
            FROM public.price_history ph 
            WHERE ph.printing_id = cp.printing_id 
              AND ph.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
              AND ph.is_foil = false
            ORDER BY ph.timestamp DESC LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 
            FROM public.price_history ph2 
            WHERE ph2.printing_id = cp.printing_id 
              AND ph2.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
              AND ph2.is_foil = false
        );
    """)
    print(f"Updated {cur.rowcount} non-foil prices.")

    print("Updating card_printings.avg_market_price_foil_usd with Card Kingdom FOIL prices...")
    cur.execute("""
        UPDATE public.card_printings cp
        SET avg_market_price_foil_usd = (
            SELECT price_usd 
            FROM public.price_history ph 
            WHERE ph.printing_id = cp.printing_id 
              AND ph.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
              AND ph.is_foil = true
            ORDER BY ph.timestamp DESC LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 
            FROM public.price_history ph2 
            WHERE ph2.printing_id = cp.printing_id 
              AND ph2.source_id = (SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1)
              AND ph2.is_foil = true
        );
    """)
    print(f"Updated {cur.rowcount} foil prices.")

    print("Refreshing materialized views...")
    try:
        cur.execute("REFRESH MATERIALIZED VIEW public.mv_unique_cards;")
        print("mv_unique_cards refreshed.")
    except Exception as e:
        print(f"Error refreshing mv_unique_cards: {e}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
