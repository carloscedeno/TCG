import requests
import logging
from typing import Dict, List, Any

class CardKingdomAPI:
    """
    CardKingdom API v2 Client for Bulk Price Acquisition.
    """
    def __init__(self):
        self.name = "cardkingdom_api"
        self.pricelist_url = "https://api.cardkingdom.com/api/v2/pricelist"

    def fetch_full_pricelist(self) -> List[Dict[str, Any]]:
        """
        Downloads the entire pricelist from CardKingdom.
        Returns a list of card objects.
        """
        logging.info(f"Downloading full pricelist from {self.pricelist_url}...")
        try:
            response = requests.get(self.pricelist_url, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # The API structure has a 'data' key which is a list
            # and a 'meta' key for versioning/timestamp
            cards = data.get('data', [])
            logging.info(f"Successfully fetched {len(cards)} cards from CardKingdom API.")
            return cards
        except Exception as e:
            logging.error(f"Error fetching CardKingdom pricelist: {e}")
            return []

    def get_price_by_scryfall_id(self, pricelist: List[Dict[str, Any]], scryfall_id: str) -> Dict[str, Any]:
        """
        Searches the downloaded pricelist for a specific scryfall_id.
        """
        for card in pricelist:
            # CardKingdom API uses underscores in keys
            if card.get('scryfall_id') == scryfall_id:
                return {
                    "price_retail": float(card.get('price_retail', 0)),
                    "price_buy": float(card.get('price_buy', 0)),
                    "qty_retail": int(card.get('qty_retail', 0)),
                    "url": f"https://www.cardkingdom.com{card.get('url')}" if card.get('url') else None,
                    "is_foil": card.get('is_foil') == 'true' or card.get('is_foil') is True
                }
        return None
