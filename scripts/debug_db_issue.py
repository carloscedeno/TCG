import os
import traceback
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')

if not url or not key:
    print("Missing environment variables")
    exit(1)

supabase = create_client(url, key)

print("--- Testing Database counts ---")
try:
    ap_count = supabase.table('aggregated_prices').select('count', count='exact').limit(0).execute().count
    ph_count = supabase.table('price_history').select('count', count='exact').limit(0).execute().count
    print(f"Aggregated Prices: {ap_count}")
    print(f"Price History: {ph_count}")
except Exception:
    traceback.print_exc()

print("\n--- Testing Color overlap filter ---")
try:
    # Test typical MTG color codes
    color_codes = ['W', 'U']
    # Many Supabase Python versions expect the filter to be applied to the column
    # If using 'inner' joins, we need to be careful with column names
    res = supabase.table('card_printings').select('printing_id, cards!inner(card_name, colors)').overlap('cards.colors', color_codes).limit(1).execute()
    print(f"Overlap Result Success: {len(res.data) > 0}")
    if res.data:
        print(f"Example: {res.data[0]}")
except Exception:
    print("\n❌ Overlap filter failed!")
    traceback.print_exc()

print("\n--- Checking for missing scryfall_ids ---")
try:
    total_printings = supabase.table('card_printings').select('count', count='exact').limit(0).execute().count
    printings_with_scryfall = supabase.table('card_printings').select('count', count='exact').is_('scryfall_id', 'not.is.null').limit(0).execute().count
    print(f"Total Printings: {total_printings}")
    print(f"Printings with Scryfall ID: {printings_with_scryfall}")
except Exception:
    traceback.print_exc()
