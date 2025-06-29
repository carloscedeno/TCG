import requests
from bs4 import BeautifulSoup
from datetime import datetime
from ..models import CardPrice
from ..utils import fetch_url, clean_text

# Puedes mejorar el selector según la estructura real de Cardmarket

def scrape_cardmarket():
    url = "https://www.cardmarket.com/en/Magic/Products/Singles/Commander-Masters/Sol-Ring"
    print(f"Scrapeando: {url}")
    html = fetch_url(url)
    if not html:
        print("No se pudo obtener la página.")
        return
    soup = BeautifulSoup(html, "lxml")
    # Buscar el precio de tendencia
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
            card_name="Sol Ring",
            set_name="Commander Masters",
            condition="Near Mint",
            price=price,
            currency="EUR",
            source="Cardmarket",
            url=url,
            scraped_at=datetime.utcnow().isoformat()
        )
        print(card_price)
        # Aquí puedes llamar a supabase_client.insert_card_price(card_price.__dict__)
    else:
        print("No se encontró el precio de tendencia en la página.") 