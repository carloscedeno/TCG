
import os
import asyncio
from src.api.utils.supabase_client import supabase

async def search_all():
    res = supabase.table('cards').select('*').ilike('card_name', '%Super-Skrull%').execute()
    print(f"Total Cards: {len(res.data)}")
    for c in res.data:
        print(f"Card: {c['card_name']}, ID: {c['card_id']}")
        p_res = supabase.table('card_printings').select('*, sets(*)').eq('card_id', c['card_id']).execute()
        print(f"  Printings: {len(p_res.data)}")
        for p in p_res.data:
            print(f"    Printing: {p['printing_id']}, Set: {p['sets']['set_name']}")

if __name__ == "__main__":
    asyncio.run(search_all())
