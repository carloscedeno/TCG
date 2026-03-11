import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from root
PROJECT_ROOT = Path(__file__).parent
load_dotenv(PROJECT_ROOT / ".env")

print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_SERVICE_ROLE_KEY is set: {bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))}")
print(f"SUPABASE_ANON_KEY is set: {bool(os.getenv('SUPABASE_ANON_KEY'))}")
