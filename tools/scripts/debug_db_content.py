import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def debug_content():
    print("--- DEBUGGING DB CONTENT ---")
    
    # 1. Check Sets Table for 'spm'
    try:
        res = supabase.table('sets').select('*').eq('set_code', 'spm').execute()
        set_id = res.data[0]['set_id'] if res.data else None
        print(f"Set 'spm': Found? {bool(res.data)}. ID: {set_id}. Name: {res.data[0]['set_name'] if res.data else 'N/A'}")
    except Exception as e:
        print(f"Error checking sets: {e}")
        return

    if not set_id:
        print("Set 'spm' not found. Aborting.")
        return

    # 2. Check Card Printings for this Set
    try:
        # Using set_id if possible, or set_code if that's the column. 
        # Usually card_printings has set_id or set_code. Let's check schema by assuming set_id first.
        # Actually in main.py it joins sets, so it must be a foreign key.
        # Let's try to just select one printing
        res = supabase.table('card_printings').select('*').eq('set_id', set_id).limit(1).execute()
        print(f"Printings for set_id {set_id}: Found {len(res.data)}")
        
        if res.data:
            p = res.data[0]
            print(f"Sample Printing: ID={p.get('printing_id')}, Card_ID={p.get('card_id')}")
            
            # 3. Check the Card Table
            card_id = p.get('card_id')
            if card_id:
                res_c = supabase.table('cards').select('*').eq('card_id', card_id).execute()
                print(f"Linked Card ({card_id}): Found? {bool(res_c.data)}")
                if res_c.data:
                    c = res_c.data[0]
                    print(f"Card Name: {c.get('card_name')}")
            else:
                print("Printing has NO card_id!")

    except Exception as e:
        print(f"Error checking printings/cards: {e}")

if __name__ == "__main__":
    debug_content()
