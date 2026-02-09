import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

async def check_ck_prices():
    admin_client = get_supabase_admin()
    
    # Check total rows for source 17
    resp = admin_client.table('price_history').select('count', count='exact').eq('source_id', 17).execute()
    print(f"Total CK entries: {resp.count}")
    
    # Check non-zero prices
    resp = admin_client.table('price_history').select('count', count='exact').eq('source_id', 17).gt('price_usd', 0).execute()
    print(f"Non-zero CK entries: {resp.count}")
    
    if resp.count == 0:
        # Check if they are null
        resp = admin_client.table('price_history').select('count', count='exact').eq('source_id', 17).is_('price_usd', 'null').execute()
        print(f"Null CK entries: {resp.count}")
        
    # Check sample
    resp = admin_client.table('price_history').select('*').eq('source_id', 17).limit(5).execute()
    print("Sample:", resp.data)

if __name__ == "__main__":
    asyncio.run(check_ck_prices())
