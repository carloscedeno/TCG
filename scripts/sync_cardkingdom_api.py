import os
import sys
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from functools import wraps

# Add project root and scraper shared directory to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

from src.api.utils.supabase_client import get_supabase_admin
import psycopg2
supabase = get_supabase_admin()

# Ensure logs directory exists before configuring logging
os.makedirs(PROJECT_ROOT / 'logs', exist_ok=True)

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

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts == max_attempts:
                        logger.error(f"Function {func.__name__} failed after {max_attempts} attempts: {e}")
                        raise
                    logger.warning(f"Attempt {attempts} for {func.__name__} failed: {e}. Retrying in {delay}s...")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry(max_attempts=3)
def update_denormalized_prices(printing_ids=None):
    """Update denormalized pricing columns in card_printings via direct SQL."""
    logger.info("--- Updating Denormalized Pricing Columns ---")
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL not found, skipping denormalized update.")
        return

    # Use consolidated CardKingdom source ID
    ck_source_id = 17

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            logger.info(f"Updating denormalized columns using source_id {ck_source_id}...")
            
            # If printing_ids is provided, we only update those specific cards (Incremental)
            # Otherwise, we update everything that has CK prices (Full/Safety Refresh)
            where_clause = ""
            if printing_ids:
                # Use psycopg2 parameter adaptation for the list
                where_clause = "AND ph.printing_id IN %s"
                params = (ck_source_id, tuple(printing_ids), ck_source_id, tuple(printing_ids))
            else:
                params = (ck_source_id, ck_source_id)

            update_sql = f"""
            -- Update non-foil prices
            WITH latest_non_foil AS (
                SELECT DISTINCT ON (ph.printing_id) ph.printing_id, ph.price_usd
                FROM public.price_history ph
                WHERE ph.source_id = %s
                AND ph.condition_id = 16 -- NM
                AND ph.is_foil = FALSE
                {where_clause}
                ORDER BY ph.printing_id, ph.timestamp DESC
            )
            UPDATE public.card_printings cp
            SET 
                avg_market_price_usd = lnf.price_usd,
                non_foil_price = lnf.price_usd
            FROM latest_non_foil lnf
            WHERE cp.printing_id = lnf.printing_id;

            -- Update foil prices
            WITH latest_foil AS (
                SELECT DISTINCT ON (ph.printing_id) ph.printing_id, ph.price_usd
                FROM public.price_history ph
                WHERE ph.source_id = %s
                AND ph.condition_id = 16 -- NM
                AND ph.is_foil = TRUE
                {where_clause}
                ORDER BY ph.printing_id, ph.timestamp DESC
            )
            UPDATE public.card_printings cp
            SET 
                avg_market_price_foil_usd = lf.price_usd,
                foil_price = lf.price_usd
            FROM latest_foil lf
            WHERE cp.printing_id = lf.printing_id;
            """
            cur.execute(update_sql, params)
            conn.commit()
            logger.info(f"Denormalized columns updated successfully ({cur.rowcount} cards affected).")
        conn.close()
    except Exception as e:
        logger.error(f"Failed to update denormalized columns (SQL Error): {e}")
        raise

def run_ck_sync():
    load_dotenv()
    
    logger.info("--- Starting Optimized CardKingdom API Sync ---")
    
    # Use consolidated ID 17
    ck_source_id = 17
    
    try:
        from scrapers.cardkingdom_api import CardKingdomAPI
        ck_client = CardKingdomAPI()
        
        logger.info("Downloading full pricelist from CardKingdom...")
        pricelist = ck_client.fetch_full_pricelist()
        
        if not pricelist:
            logger.error("Failed to download pricelist from CardKingdom API")
            return
        
        logger.info(f"Pricelist downloaded: {len(pricelist)} items.")
        
        # Pre-process pricelist into a map for O(1) matching
        pricelist_map = {}
        for card in pricelist:
            scid = card.get('scryfall_id')
            if scid:
                if scid not in pricelist_map:
                    pricelist_map[scid] = []
                pricelist_map[scid].append(card)
        
        batch_size = 1000
        offset = 0
        total_updated = 0
        total_errors = 0
        all_changed_printing_ids = set()
        
        while True:
            logger.info(f"Processing batch: offset {offset}...")
            try:
                db_cards_query = supabase.table('card_printings').select(
                    'printing_id, scryfall_id'
                ).not_.is_('scryfall_id', 'null').range(offset, offset + batch_size - 1).execute()
                db_cards = db_cards_query.data
            except Exception as e:
                logger.error(f"Failed to fetch batch from DB: {e}")
                time.sleep(2)
                continue
            
            if not db_cards:
                break
            
            price_entries = []
            current_batch_printing_ids = [c['printing_id'] for c in db_cards]
            
            for db_card in db_cards:
                try:
                    scryfall_id = db_card['scryfall_id']
                    if scryfall_id not in pricelist_map:
                        continue
                        
                    for card in pricelist_map[scryfall_id]:
                        is_foil = card.get('is_foil') == 'true' or card.get('is_foil') is True
                        price = float(card.get('price_retail', 0))
                        
                        if price > 0:
                            price_entries.append({
                                "printing_id": db_card['printing_id'],
                                "source_id": ck_source_id,
                                "condition_id": 16, # Near Mint
                                "price_usd": price,
                                "url": f"https://www.cardkingdom.com{card.get('url')}" if card.get('url') else None,
                                "is_foil": is_foil,
                                "price_type": "retail",
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                            
                except Exception as e:
                    total_errors += 1
                    if total_errors <= 10:
                        logger.error(f"Error matching card {db_card.get('printing_id')}: {e}")
            
            if price_entries:
                try:
                    # IMPLEMENTACIÓN DE ALMACENAMIENTO DIFERENCIAL
                    last_prices = {} 
                    chunk_size_query = 100
                    for i in range(0, len(current_batch_printing_ids), chunk_size_query):
                        sub_batch_ids = current_batch_printing_ids[i:i + chunk_size_query]
                        try:
                            last_prices_query = supabase.table('price_history') \
                                .select('printing_id, price_usd, is_foil') \
                                .in_('printing_id', sub_batch_ids) \
                                .eq('source_id', ck_source_id) \
                                .order('timestamp', desc=True) \
                                .execute()
                            
                            for row in last_prices_query.data:
                                key = (row['printing_id'], row.get('is_foil', False))
                                if key not in last_prices:
                                    last_prices[key] = float(row['price_usd'])
                        except Exception as sqe:
                            logger.warning(f"Failed to fetch historical chunk {i}: {sqe}")
                    
                    # Filtrar solo los registros que han cambiado
                    differential_entries = [
                        e for e in price_entries 
                        if (e['printing_id'], e['is_foil']) not in last_prices 
                        or abs(float(e['price_usd']) - last_prices[(e['printing_id'], e['is_foil'])]) > 0.001
                    ]
                    
                    if differential_entries:
                        # Batch insert changed prices
                        supabase.table('price_history').insert(differential_entries).execute()
                        total_updated += len(differential_entries)
                        
                        # Collect IDs for incremental denormalization
                        for de in differential_entries:
                            all_changed_printing_ids.add(de['printing_id'])
                            
                        logger.info(f"Inserted {len(differential_entries)} updated prices.")
                    else:
                        logger.info(f"No changes in batch of {len(current_batch_printing_ids)} cards.")
                        
                except Exception as e:
                    logger.error(f"Failed to process differential batch: {e}")
            
            if len(db_cards) < batch_size:
                break
            
            offset += batch_size
        
        # ONE-TIME DENORMALIZATION OUTSIDE THE LOOP
        if all_changed_printing_ids:
            logger.info(f"Finished sync. Updating denormalized prices for {len(all_changed_printing_ids)} cards...")
            # We can still do it in chunks if all_changed_printing_ids is giant
            changed_list = list(all_changed_printing_ids)
            chunk_size_denorm = 5000
            for i in range(0, len(changed_list), chunk_size_denorm):
                sub_list = changed_list[i : i + chunk_size_denorm]
                update_denormalized_prices(sub_list)
        else:
            logger.info("No prices changed. Skipping denormalization update.")
            
        # Final refresh of Materialized Views
        logger.info("--- Refreshing Catalog Data ---")
        try:
            supabase.rpc('refresh_all_catalog_data').execute()
            logger.info("Catalog refresh successful.")
        except Exception as e:
            logger.error(f"Failed to refresh catalog: {e}")

        logger.info("=== SYNC SUMMARY ===")
        logger.info(f"Total prices updated (differential): {total_updated}")
        logger.info(f"Total cards needing denormalization: {len(all_changed_printing_ids)}")
        logger.info(f"Total errors: {total_errors}")
        logger.info("====================")
        
    except Exception as e:
        logger.critical(f"Critical error during sync: {e}", exc_info=True)

if __name__ == "__main__":
    run_ck_sync()
