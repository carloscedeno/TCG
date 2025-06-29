import logging
from datetime import datetime
from bs4 import BeautifulSoup
from ..models import CardPrice
from ..utils import fetch_url, clean_text
from ..supabase_client import insert_card_price

def scrape_tcgplayer(row):
    """
    Scrapea el precio de una carta de TCGplayer y lo guarda en Supabase.
    row: dict con keys: url, card_name, set_name, condition
    """
    url = row['url']
    card_name = row['card_name']
    set_name = row['set_name']
    condition = row.get('condition', 'Near Mint')
    logging.info(f"[TCGplayer] Scrapeando: {card_name} ({set_name}) -> {url}")
    html = fetch_url(url)
    if not html:
        logging.error(f"No se pudo obtener la página para {card_name}")
        return
    soup = BeautifulSoup(html, "lxml")
    # TCGplayer muestra el precio de mercado en un span con data-testid='product-market-price'
    price_elem = soup.find("span", attrs={"data-testid": "product-market-price"})
    price = None
    if price_elem:
        price_text = clean_text(price_elem.text)
        try:
            price = float(price_text.replace('$', '').replace(',', '').strip())
        except Exception:
            price = None
    if price:
        card_price = CardPrice(
            card_name=card_name,
            set_name=set_name,
            condition=condition,
            price=price,
            currency="USD",
            source="TCGplayer",
            url=url,
            scraped_at=datetime.utcnow().isoformat()
        )
        logging.info(f"Precio encontrado: {card_price.price} USD")
        insert_card_price(card_price.__dict__)
    else:
        logging.warning(f"No se encontró el precio para {card_name}") 