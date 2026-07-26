import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.db import get_supabase
supabase = get_supabase()

res = supabase.table('accessories').select('id, name, price, stock').gt('stock', 0).limit(3).execute()
for acc in res.data:
    print(f"Accessory: {acc['name']} (ID: {acc['id']}), Price: {acc['price']}, Stock: {acc['stock']}")
