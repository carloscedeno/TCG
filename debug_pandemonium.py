import os
from supabase import create_client

def get_env_var(var_name):
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith(f'{var_name}='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return os.environ.get(var_name)

def check_pandemonium():
    url = "https://sxuotvogwvmxuvwbsscv.supabase.co"
    key = get_env_var('SUPABASE_SERVICE_ROLE_KEY')
    supabase = create_client(url, key)

    print("Searching for Pandemonium printings...")
    # card_printings doesn't have name sometimes, it's usually in 'cards' table joined by card_id
    # But usually CP has it denormalized for search. Let's check CP columns via RPC or just select *
    
    # Try selecting from cards joined with card_printings
    res = supabase.table("card_printings").select("id, card_id, avg_market_price_usd").execute()
    # That's too many. Let's try to find by card name in 'cards' table
    cards = supabase.table("cards").select("id, name").ilike("name", "Pandemonium").execute()
    
    for c in cards.data:
        cid = c['id']
        name = c['name']
        print(f"Card: {name}, ID: {cid}")
        
        print(f"  Printings for {name}:")
        printings = supabase.table("card_printings").select("id, set_id, avg_market_price_usd").eq("card_id", cid).execute()
        for p in printings.data:
            pid = p['id']
            sid = p['set_id']
            price = p['avg_market_price_usd']
            
            # Get set name
            set_res = supabase.table("sets").select("set_name, set_code").eq("id", sid).execute()
            set_info = set_res.data[0] if set_res.data else {"set_name": "Unknown", "set_code": "???"}
            
            print(f"    Printing ID: {pid}, Set: {set_info['set_name']} ({set_info['set_code']}), Price: {price}")
            
            # Check price history
            print(f"      Price History (Source 17 - CK):")
            history = supabase.table("price_history").select("*").eq("printing_id", pid).eq("source_id", 17).order("timestamp", desc=True).limit(3).execute()
            for h in history.data:
                print(f"        Price: {h['price_usd']}, Foil: {h['is_foil']}, Time: {h['timestamp']}")
            
            print(f"      Price History (Source 1 - Legacy?):")
            history_old = supabase.table("price_history").select("*").eq("printing_id", pid).eq("source_id", 1).order("timestamp", desc=True).limit(3).execute()
            for h in history_old.data:
                print(f"        Price: {h['price_usd']}, Foil: {h['is_foil']}, Time: {h['timestamp']}")

if __name__ == "__main__":
    check_pandemonium()
