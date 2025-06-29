import csv
from datetime import datetime
from bs4 import BeautifulSoup
from ..models import CardPrice
from ..utils import fetch_url, clean_text
from ..supabase_client import insert_card_price
import logging

INPUT_CSV = "input_urls.csv"


def scrape_cardmarket():
    """
    Lee un archivo CSV con URLs de cartas, scrapea el precio de tendencia de cada una,
    guarda el resultado en Supabase y loggea el proceso.
    """
    logging.info(f"Leyendo URLs desde {INPUT_CSV}")
    with open(INPUT_CSV, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            url = row['url']
            card_name = row['card_name']
            set_name = row['set_name']
            condition = row.get('condition', 'Near Mint')
            logging.info(f"Scrapeando: {card_name} ({set_name}) -> {url}")
            html = fetch_url(url)
            if not html:
                logging.error(f"No se pudo obtener la página para {card_name}")
                continue
            soup = BeautifulSoup(html, "lxml")
            price_elem = soup.find("span", class_="price-container")
            price = None
            if price_elem:
                price_text = clean_text(price_elem.text)
                try:
                    price = float(price_text.replace('€', '').replace(',', '.'))
                except Exception:
                    price = None
            if price:
                card_price = CardPrice(
                    card_name=card_name,
                    set_name=set_name,
                    condition=condition,
                    price=price,
                    currency="EUR",
                    source="Cardmarket",
                    url=url,
                    scraped_at=datetime.utcnow().isoformat()
                )
                logging.info(f"Precio encontrado: {card_price.price} EUR")
                insert_card_price(card_price.__dict__)
            else:
                logging.warning(f"No se encontró el precio de tendencia para {card_name}") 