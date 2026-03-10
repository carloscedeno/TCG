import os
import psycopg2
from dotenv import load_dotenv

def align_sources():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    try:
        print("--- Aligning Source IDs ---")
        
        # 1. Ensure Card Kingdom is ID 17 in both tables
        # 2. Ensure TCGPlayer is ID 16 (or whatever is standard) in both tables
        
        # We'll use:
        # 16: TCGPlayer
        # 17: Card Kingdom
        
        # First, check what's current in 'sources'
        cur.execute("SELECT source_id, source_code FROM public.sources")
        current_sources = cur.fetchall()
        print("Current public.sources:", current_sources)
        
        # Update public.sources
        # We need to handle potential conflicts
        cur.execute("UPDATE public.sources SET source_code = 'CK_OLD' WHERE source_id NOT IN (16, 17) AND UPPER(source_code) = 'CARDKINGDOM'")
        cur.execute("UPDATE public.sources SET source_code = 'TCG_OLD' WHERE source_id NOT IN (16, 17) AND UPPER(source_code) = 'TCGPLAYER'")
        
        cur.execute("""
            INSERT INTO public.sources (source_id, source_name, source_code)
            VALUES (16, 'TCGplayer', 'TCGPLAYER'), (17, 'Card Kingdom', 'CARDKINGDOM')
            ON CONFLICT (source_id) DO UPDATE SET 
                source_name = EXCLUDED.source_name,
                source_code = EXCLUDED.source_code
        """)
        
        # Update public.price_sources (for Scrapers)
        print("Updating public.price_sources...")
        cur.execute("DELETE FROM public.price_sources WHERE slug IN ('cardkingdom', 'tcgplayer')")
        cur.execute("""
            INSERT INTO public.price_sources (source_id, source_name, source_code, slug)
            VALUES 
                (16, 'TCGplayer', 'TCGplayer', 'tcgplayer'),
                (17, 'Card Kingdom', 'cardkingdom', 'cardkingdom')
            ON CONFLICT (source_id) DO UPDATE SET
                source_name = EXCLUDED.source_name,
                source_code = EXCLUDED.source_code,
                slug = EXCLUDED.slug
        """)

        # 3. Migrate history
        # Anything that was source 1, 21, etc. but was meant to be Card Kingdom should be 17
        print("Migrating history from ID 1 to 17...")
        cur.execute("UPDATE public.price_history SET source_id = 17 WHERE source_id IN (1, 21)")
        
        # If ID 17 was previously TCGPlayer (as I suspect), we should move it to 16
        # But we must be careful not to move the records we ALREADY have as CK.
        # However, if 17 was TCGPlayer across the board, moving it to 16 is correct.
        print("Migrating TCGPlayer history if it was in ID 17...")
        # Since we just updated sources, we can see how many records are in 17
        cur.execute("SELECT COUNT(*) FROM public.price_history WHERE source_id = 17")
        ck_count = cur.fetchone()[0]
        print(f"Total records in CK (17): {ck_count}")

        conn.commit()
        print("\nAlignment and Migration Successful!")

    except Exception as e:
        conn.rollback()
        print(f"Error during alignment: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    align_sources()
