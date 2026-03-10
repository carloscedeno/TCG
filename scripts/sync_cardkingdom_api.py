import os
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Add project root and scraper shared directory to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "data" / "scrapers" / "shared"))

from src.api.utils.supabase_client import get_supabase_admin
import psycopg2
supabase = get_supabase_admin()

def update_denormalized_prices():
    """Update denormalized pricing columns in card_printings via direct SQL."""
    logger.info("--- Updating Denormalized Pricing Columns ---")
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL not found, skipping denormalized update.")
        return

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # Get CK source ID from 'price_sources' table
            cur.execute("SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1")
            res = cur.fetchone()
            if not res:
                logger.error("CardKingdom source not found in database.")
                return
            ck_source_id = res[0]

            update_sql = """
            DO $$
            BEGIN
                -- Update non-foil prices
                WITH latest_non_foil AS (
                    SELECT DISTINCT ON (printing_id) printing_id, price_usd
                    FROM public.price_history
                    WHERE source_id = %s
                    AND condition_id = (SELECT condition_id FROM public.conditions WHERE UPPER(condition_code) = 'NM' LIMIT 1)
                    AND is_foil = FALSE
                    ORDER BY printing_id, timestamp DESC
                )
                UPDATE public.card_printings cp
                SET 
                    avg_market_price_usd = lnf.price_usd,
                    non_foil_price = lnf.price_usd
                FROM latest_non_foil lnf
                WHERE cp.printing_id = lnf.printing_id;

                -- Update foil prices
                WITH latest_foil AS (
                    SELECT DISTINCT ON (printing_id) printing_id, price_usd
                    FROM public.price_history
                    WHERE source_id = %s
                    AND condition_id = (SELECT condition_id FROM public.conditions WHERE UPPER(condition_code) = 'NM' LIMIT 1)
                    AND is_foil = TRUE
                    ORDER BY printing_id, timestamp DESC
                )
                UPDATE public.card_printings cp
                SET 
                    avg_market_price_foil_usd = lf.price_usd,
                    foil_price = lf.price_usd
                FROM latest_foil lf
                WHERE cp.printing_id = lf.printing_id;
            END $$;
            """
            cur.execute(update_sql, (ck_source_id, ck_source_id))
            conn.commit()
            logger.info("Denormalized pricing columns updated successfully.")
        conn.close()
    except Exception as e:
        logger.error(f"Failed to update denormalized columns: {e}")

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
        
        # Get CardKingdom source_id from 'price_sources' table
        source_query = supabase.table('price_sources').select('source_id').eq('source_code', 'cardkingdom').single().execute()
        ck_source_id = source_query.data['source_id'] if source_query.data else 1
        
        # Pre-process pricelist into a map for O(1) matching
        # Key: scryfall_id, Value: list of matching cards
        pricelist_map = {}
        for card in pricelist:
            scid = card.get('scryfall_id')
            if scid:
                if scid not in pricelist_map:
                    pricelist_map[scid] = []
                pricelist_map[scid].append(card)
        
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
                                "stock_quantity": int(card.get('qty_retail', 0)),
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                            
                except Exception as e:
                    total_errors += 1
                    if total_errors <= 10:
                        logger.error(f"Error matching card {db_card.get('printing_id')}: {e}")
            
            if price_entries:
                try:
                    # IMPLEMENTACIÓN DE ALMACENAMIENTO DIFERENCIAL
                    # Buscamos el último precio registrado para estas cartas para evitar duplicados
                    printing_ids = [e['printing_id'] for e in price_entries]
                    
                    # RPC personalizado o consulta filtrada para obtener los últimos precios
                    # Para simplificar y asegurar compatibilidad, consultamos los últimos registros
                    last_prices_query = supabase.table('price_history') \
                        .select('printing_id, price_usd, is_foil') \
                        .in_('printing_id', printing_ids) \
                        .eq('source_id', ck_source_id) \
                        .order('timestamp', desc=True) \
                        .execute()
                    
                    # Mapear últimos precios por printing_id e is_foil
                    last_prices = {} # Key: (printing_id, is_foil)
                    for row in last_prices_query.data:
                        key = (row['printing_id'], row.get('is_foil', False))
                        if key not in last_prices:
                            last_prices[key] = float(row['price_usd'])
                    
                    # Filtrar solo los registros que han cambiado o son nuevos
                    differential_entries = [
                        e for e in price_entries 
                        if (e['printing_id'], e['is_foil']) not in last_prices 
                        or abs(float(e['price_usd']) - last_prices[(e['printing_id'], e['is_foil'])]) > 0.001
                    ]
                    
                    if differential_entries:
                        # Supabase supports bulk insert
                        supabase.table('price_history').insert(differential_entries).execute()
                        total_updated += len(differential_entries)
                        logger.info(f"Inserted {len(differential_entries)} differential prices (Skipped {len(price_entries) - len(differential_entries)} duplicates).")
                    else:
                        logger.info(f"All {len(price_entries)} prices in this batch were identical to the last recorded. Skipping.")
                        
                except Exception as e:
                    logger.error(f"Failed to process differential batch: {e}")
            
            # If we got fewer results than requested, we've reached the end
            if len(db_cards) < batch_size:
                logger.info("Reached end of database cards.")
                break
                
            # Update denormalized columns after each batch for real-time progress
            update_denormalized_prices()
            
            # Increment offset
            offset += batch_size
        
        # Final refresh of Materialized Views
        logger.info("--- Refreshing Catalog Data ---")
        try:
            supabase.rpc('refresh_all_catalog_data').execute()
            logger.info("Catalog refresh successful.")
        except Exception as e:
            logger.error(f"Failed to refresh catalog: {e}")

        logger.info("=== SYNC SUMMARY ===")
        logger.info(f"Total prices updated: {total_updated}")
        logger.info(f"Total errors: {total_errors}")
        logger.info("====================")
        
    except Exception as e:
        logger.critical(f"Critical error during sync: {e}", exc_info=True)

if __name__ == "__main__":
    run_ck_sync()
