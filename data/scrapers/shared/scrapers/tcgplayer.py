import logging
from datetime import datetime
from bs4 import BeautifulSoup
try:
    from ..data.models import ScrapingResult
    from ..utils.anti_bot import AntiBotManager
except ImportError:
    from data.models import ScrapingResult
    from utils.anti_bot import AntiBotManager
import requests
import json
import re

class TCGPlayerScraper:
    def __init__(self, anti_bot_manager: AntiBotManager = None):
        self.name = "tcgplayer"
        self.anti_bot_manager = anti_bot_manager
        
    def scrape_card(self, url: str) -> dict:
        """
        Scrapea el precio de mercado de una carta de TCGPlayer.
        Nota: TCGPlayer usa mucho JS, por lo que BS4 puro puede fallar.
        Intentamos extraer datos de scripts si están disponibles.
        """
        logging.info(f"[TCGPlayer] Scrapeando URL: {url}")
        
        try:
            config = {'headers': {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }, 'timeout': 15}
            
            if self.anti_bot_manager:
                anti_bot_config = self.anti_bot_manager.get_request_config()
                config['headers'].update(anti_bot_config.get('headers', {}))
                config.update({k: v for k, v in anti_bot_config.items() if k != 'headers'})
                config['timeout'] = 15
            
            resp = requests.get(url, **config)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Status code {resp.status_code}"}
            
            soup = BeautifulSoup(resp.text, "lxml")
            
            # Intento 1: Buscar el market price en los seletores conocidos
            price_elem = soup.find("span", attrs={"data-testid": "product-market-price"})
            price = None
            
            if price_elem:
                price_text = price_elem.text.strip()
                try:
                    price = float(price_text.replace('$', '').replace(',', '').strip())
                except Exception:
                    price = None
            
            # Intento 2: Buscar en JSON-LD (Schema.org)
            if price is None:
                script_tag = soup.find("script", type="application/ld+json")
                if script_tag:
                    try:
                        data = json.loads(script_tag.string)
                        # TCGPlayer suele tener una lista o un Product
                        if isinstance(data, list):
                            product = data[0]
                        else:
                            product = data
                        
                        offers = product.get('offers', {})
                        if isinstance(offers, dict):
                            price = offers.get('price')
                        elif isinstance(offers, list):
                            price = offers[0].get('price')
                            
                        if price:
                            price = float(price)
                    except Exception:
                        pass
            
            if price is not None:
                return {
                    "success": True,
                    "price": price,
                    "currency": "USD",
                    "scraped_at": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "No se encontró el precio de mercado"}
                
        except Exception as e:
            logging.error(f"Error en TCGPlayerScraper: {e}")
            return {"success": False, "error": str(e)}