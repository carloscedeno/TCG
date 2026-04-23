import os
import sys
import json
from pathlib import Path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

from dotenv import load_dotenv
from src.api.utils.supabase_client import get_supabase_admin
from scrapers.cardkingdom_api import CardKingdomAPI

load_dotenv()
supabase = get_supabase_admin()
ck_client = CardKingdomAPI()

def compare_prices():
    print("Fetching cards from DB...")
    # Fetch 10 cards with current prices
    res = supabase.table('card_printings').select(
        'printing_id, scryfall_id, avg_market_price_usd, cards(card_name), sets(set_name)'
    ).not_.is_('avg_market_price_usd', 'null').limit(10).execute()
    
    db_cards = res.data
    if not db_cards:
        print("No cards found in DB with prices.")
        return

    print("Fetching pricelist from CardKingdom...")
    pricelist = ck_client.fetch_full_pricelist()
    pricelist_map = {c.get('scryfall_id'): c for c in pricelist if c.get('scryfall_id')}

    print(f"\n{'Card Name':<30} | {'Set':<20} | {'DB Price':<8} | {'CK Price':<8} | {'Diff':<8}")
    print("-" * 85)
    
    for db_card in db_cards:
        name = db_card['cards']['card_name']
        set_name = db_card['sets']['set_name']
        db_price = float(db_card['avg_market_price_usd'])
        scid = db_card['scryfall_id']
        
        ck_card = pricelist_map.get(scid)
        if ck_card:
            ck_price = float(ck_card.get('price_retail', 0))
            diff = ck_price - db_price
            print(f"{name[:30]:<30} | {set_name[:20]:<20} | {db_price:<8.2f} | {ck_price:<8.2f} | {diff:<+8.2f}")
        else:
            print(f"{name[:30]:<30} | {set_name[:20]:<20} | {db_price:<8.2f} | {'N/A':<8} | {'-':<8}")

if __name__ == "__main__":
    compare_prices()
