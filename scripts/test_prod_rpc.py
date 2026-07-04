import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.prod')

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials in .env.prod")
    exit(1)

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

print(f"Testing RPC endpoints on {SUPABASE_URL}...")

# Test get_accessories_filtered
payload_acc = {
    "p_game_id": None,
    "p_game_code": None,
    "p_category": None,
    "p_category_code": None,
    "p_parent_code": None,
    "p_search_query": None,
    "p_price_min": None,
    "p_price_max": None,
    "p_only_discount": False,
    "p_only_presale": False,
    "p_sort": "newest",
    "p_limit": 5,
    "p_offset": 0
}

url_acc = f"{SUPABASE_URL}/rest/v1/rpc/get_accessories_filtered"
r_acc = requests.post(url_acc, json=payload_acc, headers=headers)
print(f"get_accessories_filtered: {r_acc.status_code}")
if r_acc.status_code != 200:
    print(r_acc.text)

# Test get_products_filtered
payload_prod = {
    "search_query": None,
    "game_filter": None,
    "set_filter": None,
    "rarity_filter": None,
    "type_filter": None,
    "color_filter": None,
    "year_from": None,
    "year_to": None,
    "price_min": None,
    "price_max": None,
    "limit_count": 5,
    "offset_count": 0,
    "p_only_new": False,
    "p_only_discount": False,
    "p_only_presale": False,
    "sort_by": "newest"
}

url_prod = f"{SUPABASE_URL}/rest/v1/rpc/get_products_filtered"
r_prod = requests.post(url_prod, json=payload_prod, headers=headers)
print(f"get_products_filtered: {r_prod.status_code}")
if r_prod.status_code != 200:
    print(r_prod.text)

# Test get_unique_cards_optimized
payload_cards = {
    "search_query": None,
    "game_ids": None,
    "rarity_filter": None,
    "set_names": None,
    "color_codes": None,
    "type_filter": None,
    "year_from": None,
    "year_to": None,
    "limit_count": 5,
    "offset_count": 0,
    "sort_by": "release_date"
}

url_cards = f"{SUPABASE_URL}/rest/v1/rpc/get_unique_cards_optimized"
r_cards = requests.post(url_cards, json=payload_cards, headers=headers)
print(f"get_unique_cards_optimized: {r_cards.status_code}")
if r_cards.status_code != 200:
    print(r_cards.text)

print("Done testing.")
