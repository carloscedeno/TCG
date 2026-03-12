
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def debug():
    card_name = 'Vibrance'
    print(f"Searching for card: {card_name}")

    # 1. Get card printings
    response = supabase.table('card_printings').select('printing_id, card_id, name, collector_number, avg_market_price_usd, avg_market_price_foil_usd, sets(set_name)').eq('name', card_name).execute()
    printings = response.data
    
    print('--- Card Printings ---')
    for p in printings:
        print(f"ID: {p['printing_id']}, Set: {p['sets']['set_name']}, Coll#: {p['collector_number']}, Mkt: {p['avg_market_price_usd']}, Mkt Foil: {p['avg_market_price_foil_usd']}")

    # 2. Get product stock
    printing_ids = [p['printing_id'] for p in printings]
    response = supabase.table('products').select('*').in_('printing_id', printing_ids).execute()
    products = response.data
    
    print('\n--- Products (Stock) ---')
    for p in products:
        print(f"ID: {p['id']}, PrintID: {p['printing_id']}, Finish: {p['finish']}, Stock: {p['stock']}, Price: {p['price']}")

if __name__ == "__main__":
    debug()
