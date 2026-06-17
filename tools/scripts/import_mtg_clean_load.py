import os
import csv
import sys
import argparse
from collections import defaultdict
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def load_csvs(directory):
    print(f"Loading CSVs from {directory}...")
    cards = defaultdict(lambda: {"quantity": 0, "name": "", "set_code": "", "condition": "", "foil": "", "price": 0.0})
    total_raw_rows = 0
    for filename in os.listdir(directory):
        if filename.endswith(".csv"):
            filepath = os.path.join(directory, filename)
            with open(filepath, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    total_raw_rows += 1
                    scryfall_id = row.get("Scryfall ID", "").strip()
                    if not scryfall_id:
                        continue
                    
                    qty = int(row.get("Quantity", 1))
                    raw_price = row.get("Purchase price", "").strip()
                    price = float(raw_price) if raw_price else 0.0
                    condition = row.get("Condition", "NM")
                    foil = row.get("Foil", "")
                    
                    # We use a composite key for grouping variants, but for the DB we mostly care about printing_id (Scryfall ID).
                    # If multiple variants of the same scryfall_id exist, we sum them or treat them differently.
                    # For simplicity of the clean load, let's group by Scryfall ID + Condition + Foil.
                    key = f"{scryfall_id}_{condition}_{foil}"
                    
                    cards[key]["quantity"] += qty
                    cards[key]["name"] = row.get("Name", "")
                    cards[key]["set_code"] = row.get("Set code", "")
                    cards[key]["condition"] = condition
                    cards[key]["foil"] = foil
                    cards[key]["price"] = price
                    cards[key]["scryfall_id"] = scryfall_id
                    
    print(f"Total raw rows read: {total_raw_rows}")
    print(f"Total unique card variants (Scryfall ID + Cond + Foil): {len(cards)}")
    return cards

def fetch_db_products():
    print("Fetching existing MTG products from Database...")
    url = f"{SUPABASE_URL}/rest/v1/products?select=id,printing_id,condition,finish&game=in.(Magic,MTG,Magic:%20The%20Gathering)"
    
    all_products = []
    # Handle pagination if necessary (Supabase default is 1000)
    headers = HEADERS.copy()
    
    offset = 0
    while True:
        headers["Range-Unit"] = "items"
        headers["Range"] = f"{offset}-{offset+999}"
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            print(f"Error fetching: {res.text}")
            break
            
        data = res.json()
        if not data:
            break
            
        all_products.extend(data)
        if len(data) < 1000:
            break
        offset += 1000
        
    print(f"Total MTG products in DB: {len(all_products)}")
    return all_products

def analyze(csv_cards, db_products):
    db_map = {}
    for p in db_products:
        pid = p.get("printing_id", "")
        if pid:
            cond = p.get("condition", "NM")
            finish = p.get("finish", "")
            if finish is None: finish = ""
            key = f"{pid}_{cond}_{finish}"
            db_map[key] = p
            
    to_update = []
    to_insert = []
    to_soft_delete = []
    
    # Check CSV cards against DB
    for key, card in csv_cards.items():
        if key in db_map:
            to_update.append((db_map[key]["id"], card))
        else:
            to_insert.append(card)
            
    # Check DB cards against CSV (Soft Delete)
    for key, p in db_map.items():
        if key not in csv_cards:
            to_soft_delete.append(p["id"])
            
    return to_update, to_insert, to_soft_delete

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Do not modify DB, just print analysis")
    args = parser.parse_args()
    
    csv_dir = r"e:\TCG Web App\Documentación\Subida de Cartas MTG 20260616"
    csv_cards = load_csvs(csv_dir)
    db_products = fetch_db_products()
    
    to_update, to_insert, to_soft_delete = analyze(csv_cards, db_products)
    
    print("\n" + "="*40)
    print("CLEAN LOAD VERIFICATION SUMMARY")
    print("="*40)
    print(f"Cartas para ACTUALIZAR (Match encontrado): {len(to_update)}")
    print(f"Cartas para INSERTAR (Nuevas): {len(to_insert)}")
    print(f"Cartas para SOFT DELETE (Stock=0): {len(to_soft_delete)}")
    
    if args.dry_run:
        print("\nDRY-RUN EXITOSO. No se ha modificado la base de datos.")
    else:
        print("\nEjecucion real omitida por seguridad. Ejecute la logica de batches aqui.")

if __name__ == "__main__":
    main()
