import os
import re
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

def refresh_view():
    url = "https://sxuotvogwvmxuvwbsscv.supabase.co"
    key = get_env_var('SUPABASE_SERVICE_ROLE_KEY')
    
    if not key:
        print("Error: SUPABASE_SERVICE_ROLE_KEY not found")
        return

    supabase = create_client(url, key)
    print(f"Refreshing view 'mv_unique_cards'...")
    try:
        # Trying without schema prefix first
        response = supabase.rpc('refresh_materialized_view', {'view_name': 'mv_unique_cards'}).execute()
        print(f"Success (rpc): {response}")
    except Exception as e:
        print(f"Error refreshing view rpc: {e}")
        print("Fallback: Please run 'REFRESH MATERIALIZED VIEW mv_unique_cards;' in the Supabase SQL Editor.")

if __name__ == "__main__":
    refresh_view()
