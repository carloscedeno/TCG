
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def diagnose_db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Check counts
        cur.execute("SELECT COUNT(*) FROM cards;")
        print(f"Cards count: {cur.fetchone()[0]}")
        
        cur.execute("SELECT COUNT(*) FROM card_printings;")
        print(f"Card Printings count: {cur.fetchone()[0]}")
        
        cur.execute("SELECT lang, COUNT(*) FROM card_printings GROUP BY lang;")
        print(f"Language distribution: {cur.fetchall()}")
        
        cur.execute("SELECT COUNT(*) FROM sets;")
        print(f"Sets count: {cur.fetchone()[0]}")

        # Try a simplified version of the MV query
        print("\nTesting simplified MV query...")
        cur.execute("""
            SELECT cp.printing_id, c.card_name, s.set_name
            FROM public.card_printings cp
            INNER JOIN public.cards c ON cp.card_id = c.card_id
            INNER JOIN public.sets s ON cp.set_id = s.set_id
            WHERE (cp.lang = 'en' OR cp.lang IS NULL)
            LIMIT 5;
        """)
        rows = cur.fetchall()
        print(f"Sample joined data: {rows}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diagnose_db()
