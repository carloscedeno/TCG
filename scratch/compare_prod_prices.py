import os
import sys
import json
from pathlib import Path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

import psycopg2
from dotenv import load_dotenv
from scrapers.cardkingdom_api import CardKingdomAPI

load_dotenv()
ck_client = CardKingdomAPI()

def compare_prices():
    print("Connecting to REAL DB (sxuotvogwvmxuvwbsscv)...")
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    cur = conn.cursor()
    
    print("Fetching cards from REAL DB...")
    # Fetch 10 cards with current prices from card_printings
    cur.execute("""
        SELECT cp.printing_id, cp.scryfall_id, cp.avg_market_price_usd, c.card_name, s.set_name
        FROM public.card_printings cp
        JOIN public.cards c ON cp.card_id = c.card_id
        JOIN public.sets s ON cp.set_id = s.set_id
        WHERE cp.avg_market_price_usd IS NOT NULL
        LIMIT 10
    """)
    db_cards = cur.fetchall()
    
    if not db_cards:
        print("No cards found in DB with prices.")
        conn.close()
        return

    print("Fetching pricelist from CardKingdom...")
    pricelist = ck_client.fetch_full_pricelist()
    pricelist_map = {c.get('scryfall_id'): c for c in pricelist if c.get('scryfall_id')}

    print(f"\n{'Card Name':<30} | {'Set':<20} | {'DB Price':<8} | {'CK Price':<8} | {'Diff':<8}")
    print("-" * 85)
    
    for pr_id, scid, db_price, name, set_name in db_cards:
        db_price = float(db_price)
        ck_card = pricelist_map.get(scid)
        if ck_card:
            ck_price = float(ck_card.get('price_retail', 0))
            diff = ck_price - db_price
            print(f"{name[:30]:<30} | {set_name[:20]:<20} | {db_price:<8.2f} | {ck_price:<8.2f} | {diff:<+8.2f}")
        else:
            print(f"{name[:30]:<30} | {set_name[:20]:<20} | {db_price:<8.2f} | {'N/A':<8} | {'-':<8}")
            
    conn.close()

if __name__ == "__main__":
    compare_prices()
