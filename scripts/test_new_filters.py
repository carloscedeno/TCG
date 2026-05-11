import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def test_new_filters():
    print("--- Testing Color Filter (Black) ---")
    res_color = supabase.rpc('get_products_filtered', {
        'color_filter': ['Black'],
        'limit_count': 5
    }).execute()
    
    print(f"Found {len(res_color.data)} results for color: Black")
    for p in res_color.data:
        # We can't see the colors in the result, but we can verify it doesn't fail
        print(f"  - {p['name']} (Set: {p['set_name']})")
    assert len(res_color.data) > 0, "No results found for Black filter"

    print("\n--- Testing Type Filter (Creature) ---")
    res_type = supabase.rpc('get_products_filtered', {
        'type_filter': ['Creature'],
        'limit_count': 5
    }).execute()
    
    print(f"Found {len(res_type.data)} results for type: Creature")
    for p in res_type.data:
        print(f"  - {p['name']} (Set: {p['set_name']})")
    assert len(res_type.data) > 0, "No results found for Creature filter"

    print("\n--- Testing Year Filter (2024) ---")
    res_year = supabase.rpc('get_products_filtered', {
        'year_from': 2024,
        'year_to': 2024,
        'limit_count': 5
    }).execute()
    
    print(f"Found {len(res_year.data)} results for year: 2024")
    for p in res_year.data:
        print(f"  - {p['name']} (Set: {p['set_name']})")
    assert len(res_year.data) > 0, "No results found for 2024 filter"

    print("\n--- Testing Combined Filters (Black + Creature + 2024) ---")
    res_combined = supabase.rpc('get_products_filtered', {
        'color_filter': ['Black'],
        'type_filter': ['Creature'],
        'year_from': 2024,
        'year_to': 2024,
        'limit_count': 5
    }).execute()
    
    print(f"Found {len(res_combined.data)} results for Black + Creature + 2024")
    for p in res_combined.data:
        print(f"  - {p['name']} (Set: {p['set_name']})")
    assert len(res_combined.data) > 0, "No results found for combined filters"

    print("\nNew Filters Verification Successful!")

if __name__ == "__main__":
    test_new_filters()
