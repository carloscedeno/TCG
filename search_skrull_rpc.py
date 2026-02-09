
import asyncio
from src.api.utils.supabase_client import supabase

async def search_skrull():
    res = supabase.rpc('get_unique_cards_optimized', {
        'search_query': 'Skrull'
    }).execute()
    for row in res.data:
        print(f"Name: {row['card_name']}, Set: {row['set_name']}, Printing ID: {row['printing_id']}")

if __name__ == "__main__":
    asyncio.run(search_skrull())
