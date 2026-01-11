import os
import sys
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Add project root and scraper shared directory to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

from src.api.utils.supabase_client import supabase

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(PROJECT_ROOT / 'logs' / 'ck_sync.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Ensure logs directory exists
os.makedirs(PROJECT_ROOT / 'logs', exist_ok=True)

def run_ck_sync():
    load_dotenv()
    
    logger.info("--- Starting CardKingdom API Sync ---")
    
    try:
        from scrapers.cardkingdom_api import CardKingdomAPI
        ck_client = CardKingdomAPI()
        
        logger.info("Downloading full pricelist from CardKingdom...")
        pricelist = ck_client.fetch_full_pricelist()
        
        if not pricelist:
            logger.error("Failed to download pricelist from CardKingdom API")
            return
        
        logger.info(f"Pricelist downloaded: {len(pricelist)} items.")
        
        # Fetch cards from DB that have scryfall_id
        # We process in batches to avoid memory/timeout issues
        logger.info("Fetching cards from database...")
        
        # Get CardKingdom source_id
        source_query = supabase.table('price_sources').select('source_id').eq('source_code', 'cardkingdom').single().execute()
        ck_source_id = source_query.data['source_id'] if source_query.data else 21
        
        # Process all cards (or a large enough subset)
        # For the automation, we might want to process more than 100
        batch_size = 1000
        offset = 0
        total_updated = 0
        total_errors = 0
        
        while True:
            logger.info(f"Processing batch: offset {offset}...")
            db_cards = supabase.table('card_printings').select(
                'printing_id, scryfall_id'
            ).not_.is_('scryfall_id', 'null').range(offset, offset + batch_size - 1).execute().data
            
            if not db_cards:
                break
            
            price_entries = []
            for db_card in db_cards:
                try:
                    match = ck_client.get_price_by_scryfall_id(pricelist, db_card['scryfall_id'])
                    if match and match.get('price_retail', 0) > 0:
                        price_entries.append({
                            "printing_id": db_card['printing_id'],
                            "source_id": ck_source_id,
                            "price_usd": match['price_retail'],
                            "url": match.get('url'),
                            "is_foil": match.get('is_foil', False),
                            "stock_quantity": match.get('qty_retail', 0)
                        })
                except Exception as e:
                    total_errors += 1
                    if total_errors <= 10:
                        logger.error(f"Error matching card {db_card.get('printing_id')}: {e}")
            
            if price_entries:
                try:
                    # Supabase supports bulk insert
                    supabase.table('price_history').insert(price_entries).execute()
                    total_updated += len(price_entries)
                    logger.info(f"Inserted {len(price_entries)} prices.")
                except Exception as e:
                    logger.error(f"Failed to insert batch: {e}")
            
            if len(db_cards) < batch_size:
                break
            
            offset += batch_size
        
        logger.info("=== SYNC SUMMARY ===")
        logger.info(f"Total prices updated: {total_updated}")
        logger.info(f"Total errors: {total_errors}")
        logger.info("====================")
        
    except Exception as e:
        logger.critical(f"Critical error during sync: {e}", exc_info=True)

if __name__ == "__main__":
    run_ck_sync()
