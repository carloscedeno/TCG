import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL to add columns
sql = """
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS foil_price NUMERIC;
ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS non_foil_price NUMERIC;
"""

try:
    print("Executing SQL to add columns...")
    res = supabase.rpc('exec_sql', {'sql': sql}).execute()
    print("Columns added successfully (or already existed).")
except Exception as e:
    print(f"Error adding columns: {e}")
