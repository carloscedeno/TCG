import asyncio
from src.api.utils.supabase_client import supabase

async def count_cards():
    try:
        response = supabase.table('card_printings').select('*', count='exact').limit(1).execute()
        print(f"Total cards in database: {response.count}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(count_cards())
