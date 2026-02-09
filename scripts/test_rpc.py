import asyncio
import os
import sys
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

async def test_rpc():
    admin_client = get_supabase_admin()
    
    print("Calling get_products_filtered...")
    try:
        # Add all params matching api.ts call
        response = admin_client.rpc('get_products_filtered', {
            'search_query': None,
            'game_filter': None,
            'set_filter': None,
            'rarity_filter': None,
            'type_filter': None,
            'color_filter': None,
            'sort_by': 'newest',
            'limit_count': 5,
            'offset_count': 0
        }).execute()
        
        data = response.data
        if data:
            print(f"Returned {len(data)} items.")
            print("First item keys:", data[0].keys())
            print("First item price:", data[0].get('price'))
            print("First item store_price:", data[0].get('store_price'))
        else:
            print("No data returned.")
            
    except Exception as e:
        print(f"Error calling RPC: {e}")

if __name__ == "__main__":
    asyncio.run(test_rpc())
