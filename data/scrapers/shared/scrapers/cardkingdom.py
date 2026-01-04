import logging
from datetime import datetime
from bs4 import BeautifulSoup
import requests

try:
    from ..data.models import ScrapingResult
    from ..utils.anti_bot import AntiBotManager
except ImportError:
    from data.models import ScrapingResult
    from utils.anti_bot import AntiBotManager

class CardKingdomScraper:
    def __init__(self, anti_bot_manager: AntiBotManager = None):
        self.name = "cardkingdom"
        self.anti_bot_manager = anti_bot_manager
        self.base_url = "https://www.cardkingdom.com"
        
    def scrape_card(self, url: str) -> dict:
        """
        Scrapea el precio de una carta de Card Kingdom.
        """
        logging.info(f"[Card Kingdom] Scrapeando URL: {url}")
        
        try:
            config = {'headers': {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }, 'timeout': 15}
            
            if self.anti_bot_manager:
                anti_bot_config = self.anti_bot_manager.get_request_config()
                config['headers'].update(anti_bot_config.get('headers', {}))
                config.update({k: v for k, v in anti_bot_config.items() if k != 'headers'})
                config['timeout'] = 15
            
            response = requests.get(url, **config)
            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
            soup = BeautifulSoup(response.text, "lxml")
            
            # Card Kingdom muestra el precio en un span con class 'stylePrice'
            price_elem = soup.find("span", class_="stylePrice")
            
            if price_elem:
                price_text = price_elem.text.strip()
                return {
                    "success": True,
                    "price": price_text,
                    "condition": "Near Mint", # CK por defecto en el main price suele ser NM
                    "is_foil": "foil" in url.lower()
                }
            
            return {"success": False, "error": "Price element not found"}
            
        except Exception as e:
            logging.error(f"Error en Card Kingdom Scraper: {e}")
            return {"success": False, "error": str(e)}