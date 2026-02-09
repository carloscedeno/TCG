import asyncio
import os
import sys
from collections import Counter

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

async def analyze_sources():
    admin_client = get_supabase_admin()
    
    print("Fetching price history sample...")
    resp = admin_client.table('price_history').select('source_id').limit(5000).execute()
    data = resp.data
    
    if not data:
        print("No history found.")
        return
        
    counts = Counter([d['source_id'] for d in data])
    print("Source ID counts in sample of 5000:")
    for sid, count in counts.items():
        print(f"Source {sid}: {count}")
        
    # Validation against sources table
    sources_resp = admin_client.table('sources').select('source_id, source_code').execute()
    s_map = {s['source_id']: s['source_code'] for s in sources_resp.data}
    print("Source Map:", s_map)

if __name__ == "__main__":
    asyncio.run(analyze_sources())
