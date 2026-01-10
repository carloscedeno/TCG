import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def check_names():
    codes = ['spm', 'tla', 'fin']
    print("--- Verifying Set Names for Frontend Filters ---")
    for code in codes:
        try:
            res = supabase.table('sets').select('set_name').eq('set_code', code).execute()
            if res.data:
                print(f"Code '{code}' => Name: '{res.data[0]['set_name']}'")
            else:
                print(f"Code '{code}' => NOT FOUND")
        except Exception as e:
            print(f"Error checking {code}: {e}")

if __name__ == "__main__":
    check_names()
