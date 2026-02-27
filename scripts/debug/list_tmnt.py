
import os
import asyncio
from src.api.utils.supabase_client import supabase

async def list_tmnt():
    s_res = supabase.table('sets').select('set_id').eq('set_name', 'Teenage Mutant Ninja Turtles').single().execute()
    set_id = s_res.data['set_id']
    
    p_res = supabase.table('card_printings').select('*, cards(card_name)').eq('set_id', set_id).execute()
    print(f"Printing count: {len(p_res.data)}")
    names = sorted(list(set([p['cards']['card_name'] for p in p_res.data])))
    for name in names:
        print(f" - {name}")

if __name__ == "__main__":
    asyncio.run(list_tmnt())
