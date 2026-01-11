import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def update_schema():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST') or 'db.sxuotvogwvmxuvwbsscv.supabase.co',
            port=os.getenv('DATABASE_PORT') or '5432',
            user=os.getenv('DATABASE_USER') or 'postgres.sxuotvogwvmxuvwbsscv',
            password=os.getenv('DATABASE_PASSWORD'),
            dbname=os.getenv('DATABASE_NAME') or 'postgres'
        )
        cur = conn.cursor()
        
        print("Adding 'lang' column to card_printings...")
        cur.execute("ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'en';")
        
        print("Creating index on card_id and lang...")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_card_printings_card_id_lang ON public.card_printings(card_id, lang);")
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Schema updated successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_schema()
