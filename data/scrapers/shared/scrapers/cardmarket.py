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

class CardmarketScraper:
    def __init__(self, anti_bot_manager: AntiBotManager = None):
        self.name = "cardmarket"
        self.anti_bot_manager = anti_bot_manager
        self.base_url = "https://www.cardmarket.com"
        
    def scrape_card(self, url: str) -> dict:
        """
        Scrapea el precio de tendencia de una carta de Cardmarket.
        """
        logging.info(f"[Cardmarket] Scrapeando URL: {url}")
        
        try:
            default_headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            }
            
            # Si tenemos anti_bot_manager, usamos su configuración
            config = {'headers': default_headers, 'timeout': 15}
            if self.anti_bot_manager:
                anti_bot_config = self.anti_bot_manager.get_request_config()
                # Merge headers, anti_bot_config headers take precedence
                config['headers'].update(anti_bot_config.get('headers', {}))
                # Update other config parameters, but ensure timeout is 15
                config.update({k: v for k, v in anti_bot_config.items() if k != 'headers'})
                config['timeout'] = 15 # Explicitly set timeout to 15
            
            resp = requests.get(url, **config)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Status code {resp.status_code}"}
            
            soup = BeautifulSoup(resp.text, "lxml")
            
            # Buscamos el precio de tendencia (Price Trend)
            # En Cardmarket suele estar en una tabla de estadísticas
            stats_container = soup.find("div", class_="info-list-container")
            price = None
            
            if stats_container:
                # Buscamos el label "Price Trend" o "Tendencia de precios"
                labels = stats_container.find_all("dt")
                values = stats_container.find_all("dd")
                
                for label, value in zip(labels, values):
                    if "Price Trend" in label.text or "Tendencia de precios" in label.text:
                        price_text = value.text.strip()
                        # Formato: "1,50 €"
                        try:
                            # Limpiamos el texto del precio
                            clean_price = price_text.replace('€', '').replace('\xa0', '').replace(' ', '').replace('.', '').replace(',', '.').strip()
                            price = float(clean_price)
                            break
                        except Exception as e:
                            logging.error(f"Error parseando precio: {price_text} -> {e}")
            
            if price is not None:
                return {
                    "success": True,
                    "price": price,
                    "currency": "EUR",
                    "scraped_at": datetime.utcnow().isoformat()
                }
            else:
                return {"success": False, "error": "No se encontró el precio de tendencia"}
                
        except Exception as e:
            logging.error(f"Error en CardmarketScraper: {e}")
            return {"success": False, "error": str(e)}