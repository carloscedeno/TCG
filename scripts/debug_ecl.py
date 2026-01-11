import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / '.env')
from src.api.utils.supabase_client import get_supabase_admin

supabase = get_supabase_admin()

res = supabase.table('sets').select('set_id, set_code, set_name, release_date').eq('set_code', 'ecl').execute()
print(f"ECL in DB: {res.data}")

res = supabase.table('sets').select('set_id, set_code, set_name, release_date').eq('set_code', 'tla').execute()
print(f"TLA in DB: {res.data}")
