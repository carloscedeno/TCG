import os
import sys
sys.path.append('e:/TCG Web App')
from dotenv import load_dotenv
from src.api.utils.supabase_client import get_supabase_admin

load_dotenv()
supabase = get_supabase_admin()

rpc_names = ["exec_sql", "run_sql", "execute_sql", "query", "sql"]

for name in rpc_names:
    try:
        res = supabase.rpc(name, {'sql': 'SELECT 1'}).execute()
        print(f"FOUND: {name}")
        break
    except Exception as e:
        print(f"Miss: {name}")
