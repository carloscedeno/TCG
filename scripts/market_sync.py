import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to allow imports
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "data" / "scrapers" / "shared"))

from scraper_manager import TCGScraperManager

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_market_sync():
    load_dotenv()
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials in environment")
        sys.exit(1)
        
    logger.info("Initializing TCG Scraper Manager for Market Sync...")
    manager = TCGScraperManager(
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        use_anti_bot=True
    )
    
    logger.info("Loading cards from Supabase that need price updates...")
    # By default load_input_data with from_supabase=True loads 100 cards
    # We can customize this if needed.
    data = manager.load_input_data(from_supabase=True)
    
    if not data:
        logger.warning("No cards found in Supabase to sync.")
        return
        
    logger.info(f"Found {len(data)} cards. Starting sync for 'cardkingdom'...")
    
    # Run sync specifically for CardKingdom as requested for two-factor valuation
    batch = manager.scrape_batch(data, sources_filter=['cardkingdom'])
    
    if batch.successful_scrapes > 0:
        logger.info(f"Successfully scraped {batch.successful_scrapes} prices.")
        manager.save_to_supabase(batch)
        logger.info("Market Sync completed and saved to Supabase.")
    else:
        logger.warning("No prices were successfully scraped.")

if __name__ == "__main__":
    run_market_sync()
