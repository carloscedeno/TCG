import psycopg2
import os
from dotenv import load_dotenv

def populate_sos():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: DATABASE_URL not found")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("--- Populating SOS products into Storefront ---")
    
    # 1. Ensure game code is standardized to MTG
    # 2. Insert all SOS printings (both finishes) into products table
    # 3. Use 0 stock by default (available for order/tracking)
    
    upsert_sql = """
    INSERT INTO public.products (
        name, game, set_code, set_name, price_usd, 
        image_url, rarity, printing_id, stock, finish, condition,
        updated_at, release_date, type_line, colors
    )
    SELECT 
        c.card_name,
        'MTG' as game,
        cp.set_code,
        s.set_name,
        COALESCE(
            CASE 
                WHEN f.finish = 'foil' THEN cp.avg_market_price_foil_usd 
                ELSE cp.avg_market_price_usd 
            END, 
            0
        ) as price_usd,
        cp.image_url,
        cp.rarity,
        cp.printing_id,
        0 as stock,
        f.finish,
        'NM' as condition,
        NOW() as updated_at,
        s.release_date,
        c.type_line,
        c.colors
    FROM public.card_printings cp
    JOIN public.sets s ON cp.set_code = s.set_code
    JOIN public.cards c ON cp.card_id = c.card_id
    CROSS JOIN (
        SELECT 'nonfoil' as finish 
        UNION ALL 
        SELECT 'foil' as finish
    ) f
    WHERE cp.set_code = 'sos'
    ON CONFLICT (printing_id, finish, condition) DO UPDATE SET
        price_usd = EXCLUDED.price_usd,
        updated_at = NOW(),
        stock = GREATEST(products.stock, EXCLUDED.stock);
    """
    
    try:
        cur.execute(upsert_sql)
        print(f"Success! {cur.rowcount} product variations upserted for SOS.")
        conn.commit()
        
        # Verify
        cur.execute("SELECT count(*) FROM products WHERE set_code = 'sos'")
        count = cur.fetchone()[0]
        print(f"Total SOS products now in storefront: {count}")
        
    except Exception as e:
        print(f"Error during upsert: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    populate_sos()
