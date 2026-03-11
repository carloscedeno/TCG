import os
from dotenv import load_dotenv

load_dotenv()

s_url = os.getenv('SUPABASE_URL')
s_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
s_anon = os.getenv('SUPABASE_ANON_KEY')

print(f"URL: [{s_url}] (len: {len(s_url) if s_url else 0})")
print(f"SERVICE_ROLE_KEY starts with: {s_key[:10] if s_key else 'None'}... (len: {len(s_key) if s_key else 0})")
print(f"ANON_KEY starts with: {s_anon[:10] if s_anon else 'None'}... (len: {len(s_anon) if s_anon else 0})")
