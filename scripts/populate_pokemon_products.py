import sys
from pathlib import Path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from sync.common.db import get_db_connection

def populate_pokemon():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        print("--- Populating Pokémon products into Storefront ---")
        
        # In Pokemon, printings already have their specific finish separated (is_foil/is_non_foil)
        upsert_sql = """
        INSERT INTO public.products (
            name, game, set_code, set_name, price_usd, 
            image_url, rarity, printing_id, stock, finish, condition,
            updated_at, release_date, type_line, colors
        )
        SELECT 
            c.card_name,
            'POKEMON' as game,
            cp.set_code,
            s.set_name,
            COALESCE(cp.avg_market_price_usd, 0) as price_usd,
            cp.image_url,
            cp.rarity,
            cp.printing_id,
            0 as stock,
            CASE WHEN cp.is_foil THEN 'foil' ELSE 'nonfoil' END as finish,
            'NM' as condition,
            NOW() as updated_at,
            s.release_date,
            NULL as type_line,
            NULL as colors
        FROM public.card_printings cp
        JOIN public.sets s ON cp.set_id = s.set_id
        JOIN public.cards c ON cp.card_id = c.card_id
        WHERE c.game_id = 23
        ON CONFLICT (printing_id, finish, condition) DO UPDATE SET
            price_usd = EXCLUDED.price_usd,
            updated_at = NOW(),
            stock = GREATEST(products.stock, EXCLUDED.stock);
        """
        
        cur.execute(upsert_sql)
        print(f"Success! {cur.rowcount} product variations upserted for Pokémon.")
        conn.commit()
        
        # Verify
        cur.execute("SELECT count(*) FROM products WHERE game = 'POKEMON'")
        count = cur.fetchone()[0]
        print(f"Total Pokémon products now in storefront: {count}")
        
    except Exception as e:
        print(f"Error during upsert: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    populate_pokemon()
