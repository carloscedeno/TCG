import requests
import logging
import json
import os
import time
from typing import Dict, List, Any

class CardKingdomAPI:
    """
    CardKingdom API v2 Client for Bulk Price Acquisition with Local Caching.
    """
    def __init__(self, cache_dir: str = "data/cache"):
        self.name = "cardkingdom_api"
        self.pricelist_url = "https://api.cardkingdom.com/api/v2/pricelist"
        self.cache_dir = cache_dir
        self.cache_file = os.path.join(cache_dir, "ck_pricelist.json")
        self.cache_duration = 86400  # 24 hours in seconds
        
        # Ensure cache directory exists
        os.makedirs(self.cache_dir, exist_ok=True)

    def fetch_full_pricelist(self) -> List[Dict[str, Any]]:
        """
        Downloads the entire pricelist from CardKingdom or loads from local cache.
        Returns a list of card objects.
        """
        # Check cache validity
        if os.path.exists(self.cache_file):
            file_age = time.time() - os.path.getmtime(self.cache_file)
            if file_age < self.cache_duration:
                logging.info(f"Loading CardKingdom pricelist from local cache ({file_age/3600:.1f}h old)...")
                try:
                    with open(self.cache_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        cards = data.get('data', [])
                        logging.info(f"Loaded {len(cards)} cards from cache.")
                        return cards
                except Exception as e:
                    logging.error(f"Error reading cache file: {e}")
                    # Fallback to download if cache is corrupt

        logging.info(f"Downloading full pricelist from {self.pricelist_url}...")
        try:
            response = requests.get(self.pricelist_url, timeout=60)
            
            if response.status_code == 429:
                logging.error("Rate limit exceeded (429). Cannot download pricelist.")
                return []
                
            response.raise_for_status()
            data = response.json()
            
            # Save to cache
            try:
                with open(self.cache_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
            except Exception as e:
                logging.warning(f"Could not save cache file: {e}")
            
            cards = data.get('data', [])
            logging.info(f"Successfully fetched {len(cards)} cards from CardKingdom API.")
            return cards
        except Exception as e:
            logging.error(f"Error fetching CardKingdom pricelist: {e}")
            return []

    def get_price_by_scryfall_id(self, pricelist: List[Dict[str, Any]], scryfall_id: str) -> Dict[str, Any]:
        """
        Searches the downloaded pricelist for a specific scryfall_id.
        Prioritizes exact match on 'scryfall_id'.
        """
        for card in pricelist:
            # CardKingdom API uses underscores in keys
            # Exact match on Scryfall ID is the gold standard
            if card.get('scryfall_id') == scryfall_id:
                return {
                    "price_retail": float(card.get('price_retail', 0)),
                    "price_buy": float(card.get('price_buy', 0)),
                    "qty_retail": int(card.get('qty_retail', 0)),
                    "url": f"https://www.cardkingdom.com{card.get('url')}" if card.get('url') else None,
                    "is_foil": card.get('is_foil') == 'true' or card.get('is_foil') is True
                }
        return None
