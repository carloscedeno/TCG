import requests
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

BASE_URL = "http://localhost:8000/api/cards"

def debug_printing_endpoint():
    print("--- 1. Getting a valid Printing ID from DB ---")
    # Get a card from Marvel set to be relevant
    try:
        # Get set_id for 'spm'
        sets = supabase.table('sets').select('set_id').eq('set_code', 'spm').execute()
        if not sets.data:
            print("Set spm not found, trying any set")
            res = supabase.table('card_printings').select('printing_id').limit(1).execute()
        else:
            set_id = sets.data[0]['set_id']
            res = supabase.table('card_printings').select('printing_id').eq('set_id', set_id).limit(1).execute()
            
        if not res.data:
            print("No printings found.")
            return

        test_id = res.data[0]['printing_id']
        print(f"Testing with ID: {test_id}")

        print("\n--- 2. Calling API Endpoint ---")
        api_url = f"{BASE_URL}/{test_id}"
        print(f"GET {api_url}")
        
        resp = requests.get(api_url)
        print(f"Status: {resp.status_code}")
        
        try:
            data = resp.json()
            print(json.dumps(data, indent=2))
        except:
            print("Response not JSON:", resp.text)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_printing_endpoint()
