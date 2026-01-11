import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_performance_tuning():
    try:
        # Use database connection parameters from .env
        conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST') or 'db.sxuotvogwvmxuvwbsscv.supabase.co',
            port=os.getenv('DATABASE_PORT') or '5432',
            user=os.getenv('DATABASE_USER') or 'postgres.sxuotvogwvmxuvwbsscv',
            password=os.getenv('DATABASE_PASSWORD'),
            dbname=os.getenv('DATABASE_NAME') or 'postgres'
        )
        cur = conn.cursor()
        
        print("🚀 Applying performance indexes to accelerate filtering...")
        
        sql_commands = [
            "CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);",
            "CREATE INDEX IF NOT EXISTS idx_cards_type_line ON cards(type_line);",
            "CREATE INDEX IF NOT EXISTS idx_cards_game_id ON cards(game_id);",
            "CREATE INDEX IF NOT EXISTS idx_cards_colors ON cards USING GIN (colors);",
            "CREATE INDEX IF NOT EXISTS idx_card_printings_scryfall_id ON card_printings(scryfall_id);",
            "CREATE INDEX IF NOT EXISTS idx_price_history_printing_id ON price_history(printing_id);"
        ]
        
        for cmd in sql_commands:
            try:
                cur.execute(cmd)
                conn.commit()
                print(f"✅ Executed: {cmd[:40]}...")
            except Exception as e:
                print(f"❌ Failed: {cmd[:40]}... Error: {e}")
                conn.rollback()

        cur.close()
        conn.close()
        print("✨ Performance tuning complete!")
        
    except Exception as e:
        print(f"🔴 Error connecting to database: {e}")

if __name__ == "__main__":
    run_performance_tuning()
