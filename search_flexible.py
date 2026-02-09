
import os
import asyncio
from src.api.utils.supabase_client import supabase

async def search_flexible():
    # Try different variations
    res1 = supabase.table('cards').select('*').ilike('card_name', '%Super Skrull%').execute()
    print(f"Super Skrull (no hyphen): {len(res1.data)}")
    for c in res1.data: print(f"  ID: {c['card_id']}")
    
    res2 = supabase.table('cards').select('*').ilike('card_name', '%Super-Skrull%').execute()
    print(f"Super-Skrull (hyphen): {len(res2.data)}")
    for c in res2.data: print(f"  ID: {c['card_id']}")

if __name__ == "__main__":
    asyncio.run(search_flexible())
