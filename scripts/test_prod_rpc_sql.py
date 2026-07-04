import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.prod')

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL is not set.")
    exit(1)

DATABASE_URL = DATABASE_URL.replace(".co:6543", ".com:6543")

import sys
import io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_rpcs():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Testing get_accessories_filtered...")
        cur.execute("""
            SELECT * FROM public.get_accessories_filtered(
                p_game_id := NULL,
                p_game_code := NULL,
                p_category := NULL,
                p_category_code := NULL,
                p_parent_code := NULL,
                p_search_query := NULL,
                p_price_min := NULL,
                p_price_max := NULL,
                p_only_discount := FALSE,
                p_only_presale := FALSE,
                p_sort := 'newest',
                p_limit := 5,
                p_offset := 0
            ) LIMIT 1;
        """)
        print("get_accessories_filtered executed successfully!")
        
        print("Testing get_products_filtered...")
        cur.execute("""
            SELECT * FROM public.get_products_filtered(
                search_query := NULL,
                game_filter := NULL,
                set_filter := NULL,
                rarity_filter := NULL,
                type_filter := NULL,
                color_filter := NULL,
                year_from := NULL,
                year_to := NULL,
                price_min := NULL,
                price_max := NULL,
                limit_count := 5,
                offset_count := 0,
                p_only_new := FALSE,
                p_only_discount := FALSE,
                p_only_presale := FALSE,
                sort_by := 'newest'
            ) LIMIT 1;
        """)
        print("get_products_filtered executed successfully!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error executing RPCs: {e}")

if __name__ == "__main__":
    test_rpcs()
