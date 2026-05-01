import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))

def verify_sync():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL not found")
        return

    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Check MTG Prices
            print("\n--- MTG (Card Kingdom) Verification ---")
            cur.execute("""
                SELECT cp.printing_id, cp.set_code, c.card_name, cp.avg_market_price_usd, cp.avg_market_price_foil_usd
                FROM card_printings cp
                JOIN cards c ON cp.card_id = c.card_id
                WHERE c.game_id = 22 AND cp.avg_market_price_usd > 0
                LIMIT 5
            """)
            mtg_samples = cur.fetchall()
            if mtg_samples:
                print(f"✅ Found {len(mtg_samples)} MTG cards with real prices.")
                for s in mtg_samples:
                    print(f"   {s['card_name']} ({s['set_code']}): ${s['avg_market_price_usd']}")
            else:
                print("⚠️ No MTG cards found with prices > 0.")

            # 2. Check Pokemon Prices
            print("\n--- Pokemon Verification ---")
            cur.execute("""
                SELECT cp.printing_id, cp.set_code, c.card_name, cp.avg_market_price_usd
                FROM card_printings cp
                JOIN cards c ON cp.card_id = c.card_id
                WHERE c.game_id = 23 AND cp.avg_market_price_usd > 0
                LIMIT 5
            """)
            pkm_samples = cur.fetchall()
            if pkm_samples:
                print(f"✅ Found {len(pkm_samples)} Pokemon cards with real prices.")
                for s in pkm_samples:
                    print(f"   {s['card_name']} ({s['set_code']}): ${s['avg_market_price_usd']}")
            else:
                print("⚠️ No Pokemon cards found with prices > 0 (Expected if sync hasn't run yet).")

            # 3. Check Product Parity
            print("\n--- Product Column Parity ---")
            cur.execute("""
                SELECT p.product_id, p.price, p.price_usd
                FROM products p
                WHERE (p.price != p.price_usd OR p.price IS NULL OR p.price_usd IS NULL)
                AND p.price IS NOT NULL AND p.price_usd IS NOT NULL
                LIMIT 5
            """)
            parity_mismatches = cur.fetchall()
            if parity_mismatches:
                print(f"⚠️ Found {len(parity_mismatches)} products with price/price_usd mismatch.")
            else:
                print("✅ Product price parity looks good (or no products with both values).")

    except Exception as e:
        print(f"❌ Verification failed: {e}")
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    verify_sync()
