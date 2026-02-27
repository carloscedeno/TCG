
import os
import asyncio
from src.api.utils.supabase_client import supabase

async def list_first_cards():
    res = supabase.rpc('get_unique_cards_optimized', {
        'limit_count': 5
    }).execute()
    for row in res.data:
        print(f"Name: {row['card_name']}, Printing ID: {row['printing_id']}, Card ID: {row['card_id']}")

if __name__ == "__main__":
    asyncio.run(list_first_cards())
