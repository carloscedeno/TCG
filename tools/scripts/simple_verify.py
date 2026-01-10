import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def verify_sets_simple():
    try:
        # Solo contar, sin selects complejos que den timeout
        res = supabase.table('sets').select('count', count='exact').eq('game_id', 22).limit(0).execute()
        total_sets = res.count
        print(f"Total Sets MTG (ID 22): {total_sets}")

        # Check a specific range of sets that are clearly "extra" or "promo"
        # Example: 'spm' (Spiderman), 'tla' (Avatar), 'fin' (Final Fantasy)
        extras = ['spm', 'tla', 'fin', 'h17', 'prm']
        print("Checking existence of special sets:")
        for code in extras:
            r = supabase.table('sets').select('set_name').eq('set_code', code).execute()
            status = "✅ Found" if r.data else "❌ Not Found"
            print(f"  - {code}: {status}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_sets_simple()
