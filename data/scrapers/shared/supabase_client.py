import os
# from azure.identity import DefaultAzureCredential # Removed unused import
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

load_dotenv()

class SupabaseClient:
    def __init__(self, url: str = None, key: str = None):
        self.url = url or os.getenv("SUPABASE_URL")
        self.key = key or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        
        if not self.url or not self.key:
            logging.error("Supabase URL or Key missing")
            self.supabase = None
        else:
            self.supabase: Client = create_client(self.url, self.key)

    def insert_price_history(self, price_data: list):
        if not self.supabase:
            return False
        try:
            resp = self.supabase.table("price_history").insert(price_data).execute()
            return True
        except Exception as e:
            logging.error(f"Error inserting price history: {e}")
            return False

    def get_cards_needing_update(self, limit: int = 100):
        if not self.supabase:
            return []
        try:
            # Query cards from card_printings
            resp = self.supabase.table("card_printings").select(
                "printing_id, card_id, cards(card_name, game_id, games(game_code)), sets(set_name), image_url"
            ).limit(limit).execute()
            return resp.data
        except Exception as e:
            logging.error(f"Error fetching cards: {e}")
            return []