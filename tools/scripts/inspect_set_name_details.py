import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def inspect_chars():
    print("--- INSPECTING MARVEL SET NAME ---")
    res = supabase.table('sets').select('set_name').eq('set_code', 'spm').execute()
    if res.data:
        name = res.data[0]['set_name']
        print(f"Raw String: '{name}'")
        print("Char Codes:")
        for c in name:
            print(f"  {c}: {ord(c)}")
    else:
        print("Set spm not found")

if __name__ == "__main__":
    inspect_chars()
