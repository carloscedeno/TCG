import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from src.api.utils.supabase_client import get_supabase_admin
import psycopg2

# Load environment variables
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

def get_db_connection():
    """Get a direct psycopg2 connection to the database."""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set.")
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
