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

def load_csvs(directory):
    print(f"Loading CSVs from {directory}...")
    cards = defaultdict(lambda: {"quantity": 0, "name": "", "set_code": "", "set_name": "", "condition": "", "foil": "", "price": 0.0, "rarity": "", "scryfall_id": ""})
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
                    
                    key = f"{scryfall_id}_{condition}_{foil}"
                    
                    cards[key]["quantity"] += qty
                    cards[key]["name"] = row.get("Name", "")
                    cards[key]["set_code"] = row.get("Set code", "")
                    cards[key]["set_name"] = row.get("Set name", "")
                    cards[key]["rarity"] = row.get("Rarity", "")
                    cards[key]["condition"] = condition
                    cards[key]["foil"] = foil
                    cards[key]["price"] = price
                    cards[key]["scryfall_id"] = scryfall_id
                    
    print(f"Total raw rows read: {total_raw_rows}")
    print(f"Total unique card variants: {len(cards)}")
    return cards

def fetch_valid_printing_ids():
    print("Fetching valid printing_ids from card_printings...")
    url = f"{SUPABASE_URL}/rest/v1/card_printings?select=printing_id"
    valid_ids = set()
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
        valid_ids.update(d["printing_id"] for d in data if d.get("printing_id"))
        if len(data) < 1000:
            break
        offset += 1000
    print(f"Total valid printing_ids fetched: {len(valid_ids)}")
    return valid_ids

def batch_insert(cards, valid_ids, batch_size=500):
    url = f"{SUPABASE_URL}/rest/v1/products"
    
    payloads = []
    for card in cards.values():
        img_url = f"https://api.scryfall.com/cards/{card['scryfall_id']}?format=image"
        
        # Only set printing_id if it exists in the database to avoid foreign key errors
        p_id = card["scryfall_id"] if card["scryfall_id"] in valid_ids else None
        
        payload = {
            "name": card["name"],
            "game": "MTG",
            "set_code": card["set_code"],
            "set_name": card["set_name"],
            "stock": card["quantity"],
            "price": card["price"],
            "price_usd": card["price"],
            "rarity": card["rarity"],
            "printing_id": p_id,
            "condition": card["condition"],
            "finish": card["foil"],
            "image_url": img_url
        }
        payloads.append(payload)
    
    total = len(payloads)
    print(f"Starting insertion of {total} records in batches of {batch_size}...")
    
    for i in range(0, total, batch_size):
        batch = payloads[i:i+batch_size]
        res = requests.post(url, headers=HEADERS, json=batch)
        if res.status_code in (200, 201):
            print(f"Batch {i//batch_size + 1} ({i} - {i+len(batch)}) inserted successfully.")
        else:
            print(f"Error in batch {i//batch_size + 1}: {res.status_code} - {res.text}")

def main():
    csv_dir = r"e:\TCG Web App\Documentación\Subida de Cartas MTG 20260616"
    cards = load_csvs(csv_dir)
    valid_ids = fetch_valid_printing_ids()
    batch_insert(cards, valid_ids)

if __name__ == "__main__":
    main()
