import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

async def check_products():
    admin_client = get_supabase_admin()
    
    # 1. Total products
    count_resp = admin_client.table('products').select("id", count="exact").execute()
    print(f"Total products: {count_resp.count}")
    
    # 2. Products with price 0
    zero_resp = admin_client.table('products').select("id, printing_id, price, stock").eq('price', 0).execute()
    print(f"Products with price 0: {len(zero_resp.data)}")
    
    # 3. Sample of price 0 products
    if zero_resp.data:
        print("Sample 0-price products:")
        for p in zero_resp.data[:5]:
            print(p)
            
    # 4. Check if price_history has data for these
    if zero_resp.data:
        pids = [p['printing_id'] for p in zero_resp.data[:5]]
        hist_resp = admin_client.table('price_history').select('*').in_('printing_id', pids).execute()
        print(f"Price history entries for sample: {len(hist_resp.data)}")
        for h in hist_resp.data:
            print(f" - PID: {h.get('printing_id')} Price: {h.get('price_usd')} Source: {h.get('source_id')}")

if __name__ == "__main__":
    asyncio.run(check_products())
