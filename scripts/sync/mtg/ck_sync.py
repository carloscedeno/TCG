import sys
import os
from pathlib import Path
from datetime import datetime, timezone
from functools import wraps
import time
from psycopg2.extras import execute_values

# Add common and project directories to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent))
PROJECT_ROOT = current_dir.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

from common.db import get_db_connection, get_supabase, setup_logging
from common.odoo_client import OdooClient
from scrapers.cardkingdom_api import CardKingdomAPI

# Initialize
logger = setup_logging("MTG_CK")
supabase = get_supabase()

# Circuit Breaker Constants
MIN_EXPECTED_CK_CARDS = 50000  # Abort if CardKingdom returns fewer than 50k cards

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
def update_denormalized_prices(conn, price_entries):
    """Update denormalized pricing columns directly from the evaluated price entries in milliseconds."""
    logger.info("--- Updating Denormalized Pricing Columns (Direct Values Engine) ---")
    if not price_entries:
        return

    non_foil_updates = [(price, pid) for pid, _, _, price, is_foil, _, _ in price_entries if not is_foil]
    foil_updates = [(price, pid) for pid, _, _, price, is_foil, _, _ in price_entries if is_foil]
    changed_pids = list(set([pid for pid, _, _, _, _, _, _ in price_entries]))

    with conn.cursor() as cur:
        # Update non-foil prices directly in card_printings
        if non_foil_updates:
            execute_values(cur, """
                UPDATE public.card_printings AS cp
                SET 
                    avg_market_price_usd = v.price,
                    non_foil_price = v.price,
                    updated_at = NOW()
                FROM (VALUES %s) AS v(price, pid)
                WHERE cp.printing_id = v.pid::uuid
            """, non_foil_updates)
            logger.info(f"Non-foil prices updated directly ({len(non_foil_updates)} printings).")

        # Update foil prices directly in card_printings
        if foil_updates:
            execute_values(cur, """
                UPDATE public.card_printings AS cp
                SET 
                    avg_market_price_foil_usd = v.price,
                    foil_price = v.price,
                    updated_at = NOW()
                FROM (VALUES %s) AS v(price, pid)
                WHERE cp.printing_id = v.pid::uuid
            """, foil_updates)
            logger.info(f"Foil prices updated directly ({len(foil_updates)} printings).")

        # Update store products for affected printing IDs
        if changed_pids:
            logger.info(f"Syncing prices to products table for {len(changed_pids)} printings...")
            cur.execute("""
                UPDATE public.products p
                SET 
                    price_usd = CASE 
                        WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN COALESCE(cp.avg_market_price_foil_usd, p.price_usd)
                        ELSE COALESCE(cp.avg_market_price_usd, p.price_usd)
                    END,
                    price = CASE 
                        WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN COALESCE(cp.avg_market_price_foil_usd, p.price)
                        ELSE COALESCE(cp.avg_market_price_usd, p.price)
                    END,
                    updated_at = NOW()
                FROM public.card_printings cp
                WHERE p.printing_id = cp.printing_id
                AND p.printing_id IN %s
                AND (
                    COALESCE(p.price, 0) != COALESCE(CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)
                    OR
                    COALESCE(p.price_usd, 0) != COALESCE(CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price_usd, 0)
                );
            """, (tuple(changed_pids),))
            logger.info(f"Store prices synced successfully ({cur.rowcount} products affected).")

        conn.commit()

def run_ck_sync():
    logger.info("==================================================")
    logger.info("--- Starting Bulletproof MTG CardKingdom Sync ---")
    logger.info("==================================================")
    
    start_time = datetime.now(timezone.utc)
    conn = None
    job_id = None
    total_inserted = 0
    
    try:
        conn = get_db_connection()
        if not conn:
            raise ConnectionError("Failed to obtain database connection.")

        with conn.cursor() as cur:
            # 0. Job tracking initialization
            try:
                cur.execute(
                    "INSERT INTO public.price_update_jobs (status, started_at, source, items_updated) "
                    "VALUES (%s, %s, %s, %s) RETURNING id;",
                    ('running', start_time, 'CardKingdom Sync', 0)
                )
                job_id = cur.fetchone()[0]
                conn.commit()
            except Exception as je:
                logger.warning(f"Failed to create job tracking record in DB: {je}")

            # 1. Fetch metadata IDs
            cur.execute("SELECT source_id FROM sources WHERE source_code = 'CARDKINGDOM'")
            row = cur.fetchone()
            if not row:
                raise ValueError("Source CARDKINGDOM not found in DB.")
            ck_source_id = row[0]

            cur.execute("SELECT condition_id FROM conditions WHERE condition_code = 'NM'")
            row = cur.fetchone()
            nm_condition_id = row[0] if row else 16

            # 2. Download CK Pricelist
            ck_client = CardKingdomAPI()
            logger.info("Downloading full pricelist from CardKingdom...")
            pricelist = ck_client.fetch_full_pricelist()
            
            # Circuit Breaker 1: Threshold check
            if not pricelist or len(pricelist) < MIN_EXPECTED_CK_CARDS:
                raise ValueError(
                    f"CIRCUIT BREAKER TRIGGERED: Pricelist contains {len(pricelist) if pricelist else 0} items "
                    f"(expected >= {MIN_EXPECTED_CK_CARDS}). Aborting to protect existing catalog prices."
                )
            
            logger.info(f"Pricelist downloaded: {len(pricelist)} items.")

            # 3. Load DB mapping & current reference prices in a single efficient query
            logger.info("Fetching mapping & reference prices from DB...")
            cur.execute(
                "SELECT printing_id, scryfall_id, avg_market_price_usd, avg_market_price_foil_usd "
                "FROM card_printings WHERE scryfall_id IS NOT NULL"
            )
            rows = cur.fetchall()
            id_map = {}
            price_map = {}
            for pid, scid, p_nf, p_f in rows:
                scid_str = str(scid)
                id_map[scid_str] = pid
                price_map[pid] = {
                    False: float(p_nf) if p_nf is not None else None,
                    True: float(p_f) if p_f is not None else None
                }

            # 4. In-Memory Matching & Diffing (Filter only genuinely changed prices)
            price_entries = []
            changed_printing_ids = set()
            now = datetime.now(timezone.utc)
            matched_items = 0
            out_of_stock_count = 0

            for item in pricelist:
                scid = str(item.get('scryfall_id') or '')
                if scid in id_map:
                    pid = id_map[scid]
                    # Robust price extraction: check NM price, fallback to retail
                    price_val = item.get('condition_values', {}).get('nm_price') or item.get('price_retail') or 0
                    qty_val = item.get('qty_retail', 0)
                    if not qty_val:
                        out_of_stock_count += 1

                    if price_val:
                        try:
                            price = float(price_val)
                            # Circuit Breaker 2: Price must be strictly positive
                            if price > 0:
                                raw_foil = item.get('is_foil')
                                is_foil = str(raw_foil).lower() == 'true' or raw_foil is True
                                matched_items += 1

                                last_price = price_map.get(pid, {}).get(is_foil)
                                # Append only if price differs by more than 0.1 cent or is new
                                if last_price is None or abs(price - last_price) > 0.001:
                                    price_entries.append((
                                        pid, ck_source_id, nm_condition_id,
                                        price, is_foil, now, 'market'
                                    ))
                                    changed_printing_ids.add(pid)
                        except (ValueError, TypeError):
                            continue

            logger.info(
                f"Matched {matched_items} card prices ({out_of_stock_count} out of stock at CK). "
                f"Found {len(price_entries)} price changes across {len(changed_printing_ids)} cards."
            )

            # 5. Fast Batch Insert of changed prices into price_history
            batch_size = 5000
            if price_entries:
                logger.info(f"Inserting {len(price_entries)} changed price entries in batches of {batch_size}...")
                insert_sql = """
                INSERT INTO public.price_history (printing_id, source_id, condition_id, price_usd, is_foil, timestamp, price_type)
                VALUES %s
                """
                for i in range(0, len(price_entries), batch_size):
                    chunk = price_entries[i:i + batch_size]
                    execute_values(cur, insert_sql, chunk)
                    total_inserted += len(chunk)
                    logger.info(f"Progress: {min(i + batch_size, len(price_entries))}/{len(price_entries)} inserted.")
                    conn.commit()

            # 6. Update Denormalized Prices in card_printings & products
            if total_inserted > 0:
                update_denormalized_prices(conn, price_entries)
            else:
                logger.info("No prices changed. Skipping denormalization update.")

            # 7. Refresh Materialized Views with transaction rollback safety
            logger.info("Refreshing Materialized Views...")
            try:
                cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_unique_cards")
                conn.commit()
                logger.info("Materialized view mv_unique_cards refreshed concurrently.")
            except Exception as ve:
                conn.rollback()
                try:
                    cur.execute("REFRESH MATERIALIZED VIEW public.mv_unique_cards")
                    conn.commit()
                    logger.info("Materialized view mv_unique_cards refreshed.")
                except Exception as ve2:
                    conn.rollback()
                    logger.warning(f"Materialized view refresh skipped: {ve2}")

            # 8. Check updated products for Odoo Sync via direct SQL
            modified_products = []
            try:
                cur.execute(
                    "SELECT id, price FROM public.products "
                    "WHERE updated_at >= %s AND price > 0",
                    (start_time,)
                )
                modified_products = cur.fetchall()
            except Exception as pe:
                logger.warning(f"Failed to query modified products for Odoo: {pe}")

        conn.commit()

        # 9. Odoo Sync Integration for products modified during this run
        try:
            logger.info("--- Checking Products for Odoo Sync ---")
            odoo_client = OdooClient()
            if odoo_client.uid:
                if modified_products:
                    logger.info(f"Found {len(modified_products)} products to sync to Odoo.")
                    odoo_updates = [{'default_code': str(p[0]), 'price': float(p[1])} for p in modified_products]
                    chunk_size = 500
                    for i in range(0, len(odoo_updates), chunk_size):
                        chunk = odoo_updates[i:i + chunk_size]
                        odoo_client.update_product_prices(chunk)
                else:
                    logger.info("No product prices changed; nothing to sync to Odoo.")
            else:
                logger.info("Odoo credentials not configured or authentication inactive. Skipping Odoo sync.")
        except Exception as oe:
            logger.error(f"Error during Odoo sync phase: {oe}", exc_info=True)

        # 10. Update price_update_jobs record on success via direct SQL
        end_time = datetime.now(timezone.utc)
        duration_ms = int((end_time - start_time).total_seconds() * 1000)
        logger.info(f"=== MTG CARDKINGDOM SYNC COMPLETED in {duration_ms / 1000:.2f}s: {total_inserted} prices updated ===")
        
        if job_id:
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE public.price_update_jobs SET status = 'completed', "
                        "completed_at = %s, duration_ms = %s, items_updated = %s WHERE id = %s",
                        (end_time, duration_ms, total_inserted, job_id)
                    )
                    conn.commit()
            except Exception as je:
                logger.warning(f"Failed to mark job as completed in DB: {je}")

    except Exception as e:
        logger.critical(f"Critical error during CardKingdom sync: {e}", exc_info=True)
        if job_id and conn and not conn.closed:
            try:
                end_time = datetime.now(timezone.utc)
                duration_ms = int((end_time - start_time).total_seconds() * 1000)
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE public.price_update_jobs SET status = 'failed', "
                        "completed_at = %s, duration_ms = %s, error_log = %s, items_updated = %s WHERE id = %s",
                        (end_time, duration_ms, str(e), total_inserted, job_id)
                    )
                    conn.commit()
            except Exception as je:
                logger.error(f"Failed to record job failure in DB: {je}")
        raise
    finally:
        if conn and not conn.closed:
            conn.close()

if __name__ == "__main__":
    run_ck_sync()
