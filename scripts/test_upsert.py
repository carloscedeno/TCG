from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    data = [{
        'game_id': 22,
        'set_name': 'Test Set',
        'set_code': 'TEST1234',
    }]
    # Try with game_id,set_code
    print("Trying game_id,set_code")
    supabase.table('sets').upsert(data, on_conflict='game_id,set_code').execute()
    print("Success with game_id,set_code!")
except Exception as e:
    print(f"Failed with game_id,set_code: {e}")

try:
    # Try with constraint name
    print("\nTrying sets_game_id_set_code_key")
    supabase.table('sets').upsert(data, on_conflict='sets_game_id_set_code_key').execute()
    print("Success with sets_game_id_set_code_key!")
except Exception as e:
    print(f"Failed with sets_game_id_set_code_key: {e}")
