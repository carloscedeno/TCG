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
    """Get a direct psycopg2 connection to the database."""
    # Priority: 
    # 1. DATABASE_URL (explicit)
    # 2. DATABASE_URL_PROD (if specified)
    # 3. DATABASE_URL_DEV (if specified)
    db_url = os.getenv('DATABASE_URL') or os.getenv('DATABASE_URL_PROD') or os.getenv('DATABASE_URL_DEV')
    
    if not db_url:
        raise ValueError("No database connection string found (DATABASE_URL, DATABASE_URL_PROD, or DATABASE_URL_DEV).")
    
    db_url = db_url.strip().replace('"', '').replace("'", "")
    
    # Clean URL if it has pooler params that might cause issues with psycopg2
    if db_url and "?" in db_url:
        db_url = db_url.split("?")[0]
        
    return psycopg2.connect(db_url)

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
