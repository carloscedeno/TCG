import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    with conn.cursor() as cur:
        print("Connected! Adding columns...")
        cur.execute("ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS foil_price NUMERIC;")
        cur.execute("ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS non_foil_price NUMERIC;")
        cur.execute("ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_usd NUMERIC;")
        cur.execute("ALTER TABLE public.card_printings ADD COLUMN IF NOT EXISTS avg_market_price_foil_usd NUMERIC;")
        conn.commit()
        print("Columns added successfully.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
