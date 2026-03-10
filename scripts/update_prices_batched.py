import os
import logging
import psycopg2
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def update_denormalized_prices_batched():
    load_dotenv()
    logger.info("--- Starting Batched Denormalized Pricing Update ---")
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cur:
            # 1. Get CK source ID
            cur.execute("SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1")
            res = cur.fetchone()
            ck_source_id = res[0] if res else 1
            
            # 2. Get Condition ID for NM
            cur.execute("SELECT condition_id FROM public.conditions WHERE UPPER(condition_code) = 'NM' LIMIT 1")
            res = cur.fetchone()
            nm_condition_id = res[0] if res else 16

            logger.info(f"Using source_id: {ck_source_id}, condition_id: {nm_condition_id}")

            # 3. Get total count of printings to update
            cur.execute("SELECT count(*) FROM public.card_printings WHERE scryfall_id IS NOT NULL")
            total_cards = cur.fetchone()[0]
            logger.info(f"Total cards to process: {total_cards}")

            batch_size = 1000
            offset = 0

            while offset < total_cards:
                logger.info(f"Processing batch: offset {offset}...")
                
                # Update both foil and non-foil in one go for a subset of printing_ids
                update_sql = """
                WITH target_cards AS (
                    SELECT printing_id 
                    FROM public.card_printings 
                    WHERE scryfall_id IS NOT NULL
                    ORDER BY printing_id
                    LIMIT %s OFFSET %s
                ),
                latest_prices AS (
                    SELECT DISTINCT ON (ph.printing_id, ph.is_foil) 
                        ph.printing_id, ph.price_usd, ph.is_foil
                    FROM public.price_history ph
                    JOIN target_cards tc ON ph.printing_id = tc.printing_id
                    WHERE ph.source_id = %s
                    AND ph.condition_id = %s
                    ORDER BY ph.printing_id, ph.is_foil, ph.timestamp DESC
                )
                UPDATE public.card_printings cp
                SET 
                    avg_market_price_usd = CASE WHEN lp.is_foil = FALSE THEN lp.price_usd ELSE cp.avg_market_price_usd END,
                    non_foil_price = CASE WHEN lp.is_foil = FALSE THEN lp.price_usd ELSE cp.non_foil_price END,
                    avg_market_price_foil_usd = CASE WHEN lp.is_foil = TRUE THEN lp.price_usd ELSE cp.avg_market_price_foil_usd END,
                    foil_price = CASE WHEN lp.is_foil = TRUE THEN lp.price_usd ELSE cp.foil_price END
                FROM latest_prices lp
                WHERE cp.printing_id = lp.printing_id;
                """
                
                cur.execute(update_sql, (batch_size, offset, ck_source_id, nm_condition_id))
                offset += batch_size

            logger.info("Batched update completed successfully.")
        conn.close()
    except Exception as e:
        logger.error(f"Error during batched update: {e}")

if __name__ == "__main__":
    update_denormalized_prices_batched()
