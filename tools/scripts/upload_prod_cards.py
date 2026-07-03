import os
import csv
from collections import defaultdict
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

PROD_DB_URL = "postgresql://postgres.sxuotvogwvmxuvwbsscv:jLta9LqEmpMzCI5r@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

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

def batch_upsert(cards):
    conn = psycopg2.connect(PROD_DB_URL)
    cur = conn.cursor()
    
    # Get valid printing_ids
    cur.execute("SELECT printing_id FROM card_printings")
    valid_ids = set(row[0] for row in cur.fetchall() if row[0])
    
    records = []
    for card in cards.values():
        img_url = f"https://api.scryfall.com/cards/{card['scryfall_id']}?format=image"
        p_id = card["scryfall_id"] if card["scryfall_id"] in valid_ids else None
        
        records.append((
            card["name"], "MTG", card["set_code"], card["set_name"], card["quantity"],
            card["price"], card["price"], card["rarity"], p_id,
            card["condition"], card["foil"], img_url
        ))

    print(f"Upserting {len(records)} records...")
    
    query = """
    INSERT INTO products (name, game, set_code, set_name, stock, price, price_usd, rarity, printing_id, condition, finish, image_url)
    VALUES %s
    ON CONFLICT (printing_id, condition, finish) 
    DO UPDATE SET 
        stock = products.stock + EXCLUDED.stock,
        price = EXCLUDED.price,
        price_usd = EXCLUDED.price_usd
    """
    
    try:
        execute_values(cur, query, records)
        conn.commit()
        print("Upsert successful.")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    csv_dir = r"e:\TCG Web App\Documentación\Subida de Cartas MTG 20260616"
    cards = load_csvs(csv_dir)
    batch_upsert(cards)
