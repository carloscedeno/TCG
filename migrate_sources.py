import os
import psycopg2
from dotenv import load_dotenv
import time

load_dotenv()

def migrate():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True # For chunking without huge transactions
    cur = conn.cursor()
    
    print("Disabling triggers on price_history...")
    try:
        # Disable trigger - using specific name identified
        cur.execute("ALTER TABLE public.price_history DISABLE TRIGGER tr_calculate_aggregated_prices")
        print("Trigger disabled.")
        
        # Consolidate price_sources first
        cur.execute("UPDATE public.price_sources SET source_id = 17 WHERE source_code = 'cardkingdom'")
        print(f"Updated {cur.rowcount} rows in price_sources.")

        # Chunked update for price_history
        chunk_size = 50000
        total_updated = 0
        
        while True:
            cur.execute(f"""
                WITH target_ids AS (
                    SELECT price_entry_id FROM public.price_history 
                    WHERE source_id IN (1, 21) 
                    LIMIT {chunk_size}
                )
                UPDATE public.price_history ph
                SET source_id = 17
                FROM target_ids
                WHERE ph.price_entry_id = target_ids.price_entry_id
            """)
            updated = cur.rowcount
            if updated == 0:
                break
            total_updated += updated
            print(f"Updated {total_updated} rows...")
            # Small delay to let DB breathe
            time.sleep(0.5)
            
        print(f"Migration complete. Total updated: {total_updated}")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        print("Re-enabling triggers...")
        try:
            cur.execute("ALTER TABLE public.price_history ENABLE TRIGGER tr_calculate_aggregated_prices")
            print("Trigger enabled.")
        except Exception as e:
            print(f"Failed to enable trigger: {e}")
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
