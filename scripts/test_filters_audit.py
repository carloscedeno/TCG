import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def test_filters():
    print("--- Testing Price Range Filters ---")
    
    # Test 1: Price Range [10, 50]
    res1 = supabase.rpc('get_products_filtered', {
        'price_min': 10,
        'price_max': 50,
        'limit_count': 5
    }).execute()
    
    print(f"Results for $10 - $50: {len(res1.data)}")
    for p in res1.data:
        print(f"  - {p['name']}: ${p['price']}")
        assert 10 <= p['price'] <= 50, f"Price {p['price']} not in range [10, 50]"

    # Test 2: Price Range [100, 500]
    res2 = supabase.rpc('get_products_filtered', {
        'price_min': 100,
        'price_max': 500,
        'limit_count': 5
    }).execute()
    
    print(f"\nResults for $100 - $500: {len(res2.data)}")
    for p in res2.data:
        print(f"  - {p['name']}: ${p['price']}")
        assert 100 <= p['price'] <= 500, f"Price {p['price']} not in range [100, 500]"

    print("\n--- Testing Sorting Logic ---")
    
    # Test 3: Price ASC
    res3 = supabase.rpc('get_products_filtered', {
        'sort_by': 'price_asc',
        'limit_count': 5
    }).execute()
    
    print("Price ASC:")
    last_price = -1
    for p in res3.data:
        print(f"  - {p['name']}: ${p['price']}")
        assert p['price'] >= last_price, "Price is not ascending"
        last_price = p['price']

    # Test 4: Price DESC
    res4 = supabase.rpc('get_products_filtered', {
        'sort_by': 'price_desc',
        'limit_count': 5
    }).execute()
    
    print("\nPrice DESC:")
    last_price = 1000000
    for p in res4.data:
        print(f"  - {p['name']}: ${p['price']}")
        assert p['price'] <= last_price, "Price is not descending"
        last_price = p['price']

    print("\n--- Testing Search Relevance ---")
    
    # Test 5: Search for 'Black' (should prioritize cards starting with Black)
    res5 = supabase.rpc('get_products_filtered', {
        'search_query': 'Black',
        'limit_count': 10
    }).execute()
    
    print("Search 'Black' results (top 5):")
    for i, p in enumerate(res5.data[:5]):
        print(f"  {i+1}. {p['name']}")
        
    print("\nVerification Successful!")

if __name__ == "__main__":
    test_filters()
