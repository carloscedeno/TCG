import os
import sys
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from functools import wraps
import psycopg2
from psycopg2.extras import execute_values

# Add project root and scraper shared directory to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data"))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

# Setup logging
os.makedirs(PROJECT_ROOT / 'logs', exist_ok=True)
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

def get_db_connection():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.error("DATABASE_URL not found in environment")
        return None
    return psycopg2.connect(db_url)

@retry(max_attempts=3)
def update_denormalized_prices(conn, printing_ids=None):
    """Update denormalized pricing columns in card_printings via direct SQL."""
    logger.info("--- Updating Denormalized Pricing Columns ---")
    
    with conn.cursor() as cur:
        # Fetch CK Source ID
        cur.execute("SELECT source_id FROM sources WHERE source_code = 'CARDKINGDOM'")
        row = cur.fetchone()
        if not row:
            logger.warning("Source CARDKINGDOM not found, skipping denormalized update.")
            return
        ck_source_id = row[0]
        
        # Fetch NM Condition ID
        cur.execute("SELECT condition_id FROM conditions WHERE condition_code = 'NM'")
        row = cur.fetchone()
        if not row:
            logger.warning("Condition NM not found, skipping denormalized update.")
            return
        nm_condition_id = row[0]

        logger.info(f"Updating denormalized columns using source_id {ck_source_id}...")
        
        where_clause = ""
        params = [ck_source_id, nm_condition_id, ck_source_id, nm_condition_id]
        if printing_ids:
            where_clause = "AND cp.printing_id IN %s"
            params.append(tuple(printing_ids))

        update_sql = f"""
        UPDATE public.card_printings cp
        SET 
            avg_market_price_usd = COALESCE(nf.price_usd, cp.avg_market_price_usd),
            avg_market_price_foil_usd = COALESCE(f.price_usd, cp.avg_market_price_foil_usd),
            last_price_update = NOW(),
            updated_at = NOW()
        FROM (
            SELECT DISTINCT ON (printing_id) printing_id, price_usd
            FROM public.price_history
            WHERE source_id = %s AND condition_id = %s AND is_foil = FALSE
            ORDER BY printing_id, timestamp DESC
        ) nf
        FULL OUTER JOIN (
            SELECT DISTINCT ON (printing_id) printing_id, price_usd
            FROM public.price_history
            WHERE source_id = %s AND condition_id = %s AND is_foil = TRUE
            ORDER BY printing_id, timestamp DESC
        ) f ON nf.printing_id = f.printing_id
        WHERE cp.printing_id = COALESCE(nf.printing_id, f.printing_id)
        {where_clause}
        """
        cur.execute(update_sql, params)
        logger.info(f"Updated {cur.rowcount} card_printings entries.")

        # Update Store Products
        logger.info("Syncing prices to products table (Store Inventory)...")
        prod_where_clause = ""
        prod_params = []
        if printing_ids:
            prod_where_clause = "AND p.printing_id IN %s"
            prod_params.append(tuple(printing_ids))

        prod_update_sql = f"""
        UPDATE public.products p
        SET 
            price = CASE 
                WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd 
                ELSE cp.avg_market_price_usd 
            END,
            updated_at = NOW()
        FROM public.card_printings cp
        WHERE p.printing_id = cp.printing_id {prod_where_clause}
        AND (
            COALESCE(p.price, 0) != COALESCE(CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)
        )
        """
        cur.execute(prod_update_sql, prod_params)
        conn.commit()
        logger.info(f"Store prices synced successfully ({cur.rowcount} products affected).")

def run_ck_sync():
    load_dotenv()
    logger.info("--- Starting Batched Direct-SQL CardKingdom API Sync ---")
    
    conn = get_db_connection()
    if not conn:
        return

    try:
        from scrapers.cardkingdom_api import CardKingdomAPI
        ck_client = CardKingdomAPI()
        
        logger.info("Downloading full pricelist from CardKingdom...")
        pricelist = ck_client.fetch_full_pricelist()
        if not pricelist:
            logger.error("Failed to download pricelist")
            return
        logger.info(f"Pricelist downloaded: {len(pricelist)} items.")

        with conn.cursor() as cur:
            # Metadata
            cur.execute("SELECT source_id FROM sources WHERE source_code = 'CARDKINGDOM'")
            ck_source_id = cur.fetchone()[0]
            cur.execute("SELECT condition_id FROM conditions WHERE condition_code = 'NM'")
            nm_condition_id = cur.fetchone()[0]

            # 1. Fetch all existing printing_ids/scryfall_ids
            logger.info("Fetching mapping data from DB...")
            cur.execute("SELECT printing_id, scryfall_id FROM card_printings WHERE scryfall_id IS NOT NULL")
            id_map = {r[1]: r[0] for r in cur.fetchall()}
            
            # 2. Match prices
            price_entries = []
            now = datetime.now(timezone.utc)
            for item in pricelist:
                scid = item.get('scryfall_id')
                if scid in id_map:
                    price_val = item.get('condition_values', {}).get('nm_price', 0)
                    if price_val:
                        price = float(price_val)
                        if price > 0:
                            price_entries.append((
                                id_map[scid], ck_source_id, nm_condition_id, 
                                price, item.get('is_foil') == 'true', now, 'market'
                            ))

            # 3. Batch Insert into price_history (Using batches of 10k)
            batch_size = 10000
            total_inserted = 0
            if price_entries:
                logger.info(f"Processing {len(price_entries)} price candidates in batches of {batch_size}...")
                
                # Create permanent temporary table for the session
                cur.execute("CREATE TEMPORARY TABLE temp_prices (printing_id uuid, source_id int, condition_id int, price_usd numeric, is_foil boolean, timestamp timestamptz, price_type text) ON COMMIT DROP")
                
                for i in range(0, len(price_entries), batch_size):
                    chunk = price_entries[i:i + batch_size]
                    cur.execute("TRUNCATE temp_prices")
                    execute_values(cur, "INSERT INTO temp_prices VALUES %s", chunk)
                    
                    # Insert only if changed
                    insert_sql = """
                    INSERT INTO public.price_history (printing_id, source_id, condition_id, price_usd, is_foil, timestamp, price_type)
                    SELECT t.printing_id, t.source_id, t.condition_id, t.price_usd, t.is_foil, t.timestamp, t.price_type
                    FROM temp_prices t
                    LEFT JOIN (
                        SELECT DISTINCT ON (printing_id, is_foil) printing_id, is_foil, price_usd
                        FROM public.price_history
                        WHERE source_id = %s
                        ORDER BY printing_id, is_foil, timestamp DESC
                    ) last ON t.printing_id = last.printing_id AND t.is_foil = last.is_foil
                    WHERE last.price_usd IS NULL OR ABS(t.price_usd - last.price_usd) > 0.001
                    """
                    cur.execute(insert_sql, (ck_source_id,))
                    total_inserted += cur.rowcount
                    logger.info(f"Progress: {min(i + batch_size, len(price_entries))}/{len(price_entries)} processed. Updated: {total_inserted}")
                    conn.commit() # Commit each batch to release locks and show progress
                
                if total_inserted > 0:
                    # 4. Denormalize
                    update_denormalized_prices(conn)
                    
                    # 5. Refresh Views
                    logger.info("Refreshing Materialized Views...")
                    try:
                        cur.execute("SELECT refresh_all_catalog_data()")
                        logger.info("Materialized views refreshed.")
                    except Exception as ve:
                        logger.warning(f"Materialized view refresh failed: {ve}")
            
            conn.commit()
            logger.info(f"=== SYNC COMPLETED: {total_inserted} prices updated ===")

    except Exception as e:
        logger.critical(f"Critical error: {e}", exc_info=True)
    finally:
        conn.close()

if __name__ == "__main__":
    run_ck_sync()
