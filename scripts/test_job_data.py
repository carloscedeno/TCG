import os
import sys
from pathlib import Path

# Add project root and sync directories to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

jobs = supabase.table('price_update_jobs').select('*').order('started_at', desc=True).limit(1).execute()
print("Latest Job:", jobs.data)

if jobs.data:
    job = jobs.data[0]
    started_at = job['started_at']
    prices = supabase.table('price_history').select('*').gte('timestamp', started_at).limit(5).execute()
    print("Prices after started_at:", prices.data)
