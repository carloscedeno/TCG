import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from src.api.utils.supabase_client import get_supabase_admin
import psycopg2

# Load environment variables
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path, override=False)

def get_db_connection():
    """Get a direct psycopg2 connection to the database with resilient fallback."""
    urls = [
        os.getenv('DATABASE_URL'),
        os.getenv('DATABASE_URL_PROD'),
        os.getenv('PROD_DATABASE_URL'),
        os.getenv('DATABASE_URL_DEV'),
    ]
    db_urls = [u.strip().replace('"', '').replace("'", "") for u in urls if u]
    
    if not db_urls:
        raise ValueError("No database connection string found in environment.")
    
    last_error = None
    for url in db_urls:
        try:
            clean_url = url.split("?")[0] if "?" in url else url
            return psycopg2.connect(clean_url, connect_timeout=10)
        except Exception as e:
            last_error = e
            continue
            
    raise last_error

def get_supabase():
    """Get the Supabase admin client."""
    return get_supabase_admin()

def setup_logging(game_code):
    """Setup logging for a specific game sync."""
    log_dir = PROJECT_ROOT / 'logs' / 'sync'
    os.makedirs(log_dir, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / f'{game_code.lower()}_sync.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(f"{game_code}_Sync")
