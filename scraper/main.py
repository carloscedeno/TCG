import sys
import csv
from scrapers.cardmarket import scrape_cardmarket
from scrapers.cardkingdom import scrape_cardkingdom
from scrapers.tcgplayer import scrape_tcgplayer
from scrapers.trollandtoad import scrape_trollandtoad

MARKETPLACES = [
    ("Cardmarket", scrape_cardmarket),
    ("Card Kingdom", scrape_cardkingdom),
    ("TCGplayer", scrape_tcgplayer),
    ("Troll and Toad", scrape_trollandtoad),
]

INPUT_CSV = "input_urls.csv"

def main():
    print("[Scraper] Plataforma Agregadora de Precios TCG")
    print("0. Todos los marketplaces")
    for idx, (name, _) in enumerate(MARKETPLACES, 1):
        print(f"{idx}. {name}")
    opcion = input("Selecciona el marketplace a scrapear (0 para todos): ")
    if opcion.strip() == "0":
        with open(INPUT_CSV, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                source = row['source'].strip().lower()
                for name, func in MARKETPLACES:
                    if name.lower() == source:
                        func(row)
    else:
        try:
            idx = int(opcion.strip()) - 1
            name, func = MARKETPLACES[idx]
            print(f"Ejecutando scraper para: {name}")
            if name == "Cardmarket":
                func()  # Cardmarket procesa todo el CSV
            else:
                with open(INPUT_CSV, newline='', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        if row['source'].strip().lower() == name.lower():
                            func(row)
        except Exception:
            print("Opción no válida.")

if __name__ == "__main__":
    main() 