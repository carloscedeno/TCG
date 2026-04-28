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
    supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')
    
    # Granular validation
    if not supabase_url:
        logger.error("❌ SUPABASE_URL is missing in environment")
        sys.exit(1)
        
    if not supabase_service_key and not supabase_anon_key:
        logger.error("❌ Both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY are missing")
        sys.exit(1)
        
    supabase_key = supabase_service_key or supabase_anon_key
        
    # Basic URL validation
    if not supabase_url.startswith('https://') or '.supabase.co' not in supabase_url:
        logger.error(f"❌ Invalid SUPABASE_URL format: {supabase_url[:10]}...")
        sys.exit(1)

    try:
        masked_key = f"{supabase_key[:4]}...{supabase_key[-4:]}"
        logger.info(f"Initializing TCG Scraper Manager for Market Sync (URL: {supabase_url[:15]}..., Key: {masked_key})")
        
        manager = TCGScraperManager(
            supabase_url=supabase_url,
            supabase_key=supabase_key,
            use_anti_bot=True
        )
        
        if not manager.supabase or not manager.supabase.supabase:
            logger.error("❌ Failed to initialize Supabase Client inside Manager")
            sys.exit(1)
        
        logger.info("Loading cards from Supabase that need price updates...")
        data = manager.load_input_data(from_supabase=True)
        
        if not data:
            logger.warning("⚠️ No cards found or failed to load data from Supabase.")
            return
            
        logger.info(f"✅ Found {len(data)} cards. Starting sync for 'cardkingdom'...")
        
        batch = manager.scrape_batch(data, sources_filter=['cardkingdom'])
        
        if batch.successful_scrapes > 0:
            logger.info(f"Successfully scraped {batch.successful_scrapes} prices.")
            manager.save_to_supabase(batch)
            logger.info("✨ Market Sync completed and saved to Supabase.")
        else:
            logger.warning("No prices were successfully scraped.")
            
    except Exception as e:
        logger.error(f"💥 Unexpected crash during market sync: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    run_market_sync()
