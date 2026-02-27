
import os
import asyncio
from src.api.utils.supabase_client import supabase

async def test_rpc():
    res = supabase.rpc('get_unique_cards_optimized', {
        'search_query': 'Super-Skrull'
    }).execute()
    print(res.data)

if __name__ == "__main__":
    asyncio.run(test_rpc())
