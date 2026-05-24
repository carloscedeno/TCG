import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def clean_url(url: str) -> str:
    if not url:
        return ""
    url = url.strip().replace('"', '').replace("'", "")
    if url and not url.startswith('http'):
        url = f"https://{url}.supabase.co"
    return url.rstrip('/')

def clean_key(key: str) -> str:
    if not key:
        return ""
    return key.strip().replace('"', '').replace("'", "")

SUPABASE_URL = clean_url(os.getenv('SUPABASE_URL'))
SUPABASE_KEY = clean_key(os.getenv('SUPABASE_ANON_KEY'))
SUPABASE_SERVICE_ROLE_KEY = clean_key(os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase environment variables not set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_admin() -> Client:
    key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY
    if not SUPABASE_URL or not key:
        raise ValueError("Supabase environment variables not set")
    return create_client(SUPABASE_URL, key)

def _get_default_client():
    try:
        return get_supabase_client()
    except ValueError:
        return None

# Global client for general use
supabase = _get_default_client()
