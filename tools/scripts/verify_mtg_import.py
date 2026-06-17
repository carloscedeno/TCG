import os
import csv
import argparse
from collections import defaultdict
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def get_csv_totals(directory):
    total_cards = 0
    total_stock = 0
    unique_variants = set()
    
    for filename in os.listdir(directory):
        if filename.endswith(".csv"):
            filepath = os.path.join(directory, filename)
            with open(filepath, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    scryfall_id = row.get("Scryfall ID", "").strip()
                    if not scryfall_id:
                        continue
                    
                    qty = int(row.get("Quantity", 1))
                    cond = row.get("Condition", "NM")
                    foil = row.get("Foil", "")
                    
                    key = f"{scryfall_id}_{cond}_{foil}"
                    unique_variants.add(key)
                    total_cards += 1
                    total_stock += qty
                    
    return len(unique_variants), total_stock

def get_db_totals():
    url = f"{SUPABASE_URL}/rest/v1/products?select=id,stock&game=in.(Magic,MTG,Magic:%20The%20Gathering)&stock=gt.0"
    
    total_db_cards = 0
    total_db_stock = 0
    
    headers = HEADERS.copy()
    offset = 0
    while True:
        headers["Range-Unit"] = "items"
        headers["Range"] = f"{offset}-{offset+999}"
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            break
        data = res.json()
        if not data:
            break
            
        total_db_cards += len(data)
        total_db_stock += sum(d.get("stock", 0) for d in data)
        
        if len(data) < 1000:
            break
        offset += 1000
        
    return total_db_cards, total_db_stock

def main():
    csv_dir = r"e:\TCG Web App\Documentación\Subida de Cartas MTG 20260616"
    print("Verificando totales en CSVs...")
    csv_unique, csv_stock = get_csv_totals(csv_dir)
    print(f"CSVs -> Variantes Unicas: {csv_unique} | Stock Total: {csv_stock}")
    
    print("\nVerificando totales en Base de Datos...")
    db_cards, db_stock = get_db_totals()
    print(f"DB -> Cartas Activas (Stock>0): {db_cards} | Stock Total: {db_stock}")
    
    print("\n--- RESULTADO DE LA VERIFICACION ---")
    if csv_unique == db_cards and csv_stock == db_stock:
        print("EXITO: Los datos en la base de datos coinciden exactamente con los CSVs.")
    else:
        print("ADVERTENCIA: Hay discrepancias entre los CSVs y la Base de Datos.")
        print(f"Diferencia en variantes: {db_cards - csv_unique}")
        print(f"Diferencia en stock total: {db_stock - csv_stock}")

if __name__ == "__main__":
    main()
