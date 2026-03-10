import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check a few cards that should have prices
res = supabase.table("card_printings").select("printing_id, foil_price, non_foil_price").not_.is_("foil_price", "null").limit(10).execute()

print(f"Cards with foil_price: {len(res.data)}")
for card in res.data:
    print(f"ID: {card['printing_id']}: Foil: {card['foil_price']}, Non-Foil: {card['non_foil_price']}")

res_non = supabase.table("card_printings").select("printing_id, foil_price, non_foil_price").not_.is_("non_foil_price", "null").limit(10).execute()
print(f"\nCards with non_foil_price: {len(res_non.data)}")
for card in res_non.data:
    print(f"ID: {card['printing_id']}: Foil: {card['foil_price']}, Non-Foil: {card['non_foil_price']}")
