import os
import logging
import psycopg2
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_denormalized_prices():
    load_dotenv()
    logger.info("--- Updating Denormalized Pricing Columns ---")
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        logger.warning("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # Get CK source ID from 'price_sources' table
            cur.execute("SELECT source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1")
            res = cur.fetchone()
            if not res:
                logger.error("CardKingdom source not found")
                return
            ck_source_id = res[0]
            logger.info(f"Using ck_source_id: {ck_source_id}")

            # Check if there are any records in price_history for this source
            cur.execute("SELECT count(*) FROM public.price_history WHERE source_id = %s", (ck_source_id,))
            count = cur.fetchone()[0]
            logger.info(f"Total records in price_history for source {ck_source_id}: {count}")

            update_sql = """
            DO $$
            DECLARE
                rows_updated_non_foil integer;
                rows_updated_foil integer;
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
            logger.info("Denormalized pricing columns updated.")
        conn.close()
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    update_denormalized_prices()
