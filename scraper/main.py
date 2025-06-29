import sys
from scrapers.cardmarket import scrape_cardmarket

if __name__ == "__main__":
    print("[Scraper] Plataforma Agregadora de Precios TCG")
    print("1. Cardmarket")
    # Aquí puedes agregar más marketplaces
    opcion = input("Selecciona el marketplace a scrapear (1): ")
    if opcion.strip() == "1":
        scrape_cardmarket()
    else:
        print("Opción no válida.") 