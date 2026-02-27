
import asyncio
from src.api.utils.supabase_client import supabase

async def verify_card():
    card_name = "Martyr of Dusk"
    set_code = "LCC"
    collector_number = "132"

    print(f"Checking for card: {card_name} ({set_code}) {collector_number}")

    # 1. Search by name
    res = supabase.table('cards').select('*').ilike('card_name', card_name).execute()
    print(f"Found {len(res.data)} cards with name '{card_name}'")
    
    for card in res.data:
        print(f"Card ID: {card['card_id']}, Name: {card['card_name']}")
        
        # 2. Get printings for this card
        p_res = supabase.table('card_printings')\
            .select('*, sets(*)')\
            .eq('card_id', card['card_id'])\
            .execute()
            
        print(f"  Found {len(p_res.data)} printings")
        found_exact = False
        for p in p_res.data:
            s_code = p['sets']['set_code']
            c_num = p['collector_number']
            print(f"    - Set: {p['sets']['set_name']} ({s_code}), Collector #: {c_num}, ID: {p['printing_id']}")
            
            if s_code.lower() == set_code.lower() and str(c_num) == str(collector_number):
                found_exact = True
                print("    *** EXACT MATCH FOUND IN DB ***")
        
        if not found_exact:
            print("    *** NO EXACT MATCH FOUND FOR THIS CARD ***")

    # 3. Check if set exists
    s_res = supabase.table('sets').select('*').eq('set_code', set_code.lower()).execute()
    if len(s_res.data) > 0:
         print(f"Set '{set_code}' found: {s_res.data[0]['set_name']}")
    else:
         print(f"Set '{set_code}' NOT found")

if __name__ == "__main__":
    asyncio.run(verify_card())
