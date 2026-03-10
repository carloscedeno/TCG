import os
import psycopg2
from dotenv import load_dotenv

def align_everything():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    try:
        # 1. Inspect price_sources schema
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'price_sources'")
        cols = [r[0] for r in cur.fetchall()]
        print(f"Columns in price_sources: {cols}")

        # 2. STANDARD IDs
        ID_TCG = 16
        ID_CK = 17

        # 3. Update public.sources
        print("\nUpdating public.sources...")
        # Move CardKingdom if it's in a weird ID, but not if it's already 17
        cur.execute("UPDATE public.sources SET source_code = 'CK_OLD' WHERE source_id NOT IN (16, 17) AND UPPER(source_code) = 'CARDKINGDOM'")
        cur.execute("""
            INSERT INTO public.sources (source_id, source_name, source_code)
            VALUES (16, 'TCGplayer', 'TCGPLAYER'), (17, 'Card Kingdom', 'CARDKINGDOM')
            ON CONFLICT (source_id) DO UPDATE SET 
                source_name = EXCLUDED.source_name,
                source_code = EXCLUDED.source_code
        """)

        # 4. Update public.price_sources
        print("Updating public.price_sources...")
        # Use columns found in inspection
        if 'source_code' in cols:
            cur.execute("DELETE FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' AND source_id != 17")
            cur.execute("DELETE FROM public.price_sources WHERE UPPER(source_code) = 'TCGPLAYER' AND source_id != 16")
        
        # Build dynamic insert for price_sources
        # We need source_id, source_name, source_code (or whatever they have)
        if 'source_id' in cols and 'source_code' in cols and 'source_name' in cols:
            cur.execute("""
                INSERT INTO public.price_sources (source_id, source_name, source_code)
                VALUES (16, 'TCGplayer', 'card_kingdom_id_fix_tcg'), (17, 'Card Kingdom', 'cardkingdom')
                ON CONFLICT (source_id) DO UPDATE SET
                    source_name = EXCLUDED.source_name,
                    source_code = EXCLUDED.source_code
            """)
        elif 'id' in cols and 'name' in cols and 'slug' in cols:
             # Logic for if it used id/name/slug as previously guessed but failed for slug
             pass
        else:
            print(f"Unknown schema for price_sources, manual update needed for: {cols}")

        # 5. MIGRACIÓN CRÍTICA DE HISTORIAL
        # Todo lo que era ID 1 (Legacy CK) -> ID 17 (Official CK)
        # Todo lo que era ID 21 (Other CK?) -> ID 17 (Official CK)
        print("Migrating history records from ID 1, 21 to 17...")
        cur.execute("UPDATE public.price_history SET source_id = 17 WHERE source_id IN (1, 21)")
        
        # Verificación de Pandemonium
        # Exo = 'exo', Pandemonium = 'Pandemonium'
        cur.execute("""
            SELECT ph.price_usd, s.set_code, ph.timestamp 
            FROM public.price_history ph
            JOIN public.card_printings cp ON ph.printing_id = cp.printing_id
            JOIN public.cards c ON cp.card_id = c.card_id
            JOIN public.sets s ON cp.set_id = s.set_id
            WHERE c.card_name = 'Pandemonium' AND s.set_code = 'exo' AND ph.source_id = 17
            ORDER BY ph.timestamp DESC LIMIT 5
        """)
        print("\nLatest Pandemonium (Exodus) Prices in DB for CK (17):")
        for r in cur.fetchall():
            print(f"Price: ${r[0]}, Set: {r[1]}, Time: {r[2]}")

        conn.commit()
        print("\nAll operations completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"FATAL ERROR: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    align_everything()
