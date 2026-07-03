import os
import csv
from collections import defaultdict
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

PROD_DB_URL = "postgresql://postgres.sxuotvogwvmxuvwbsscv:jLta9LqEmpMzCI5r@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def load_csvs(directory):
    print(f"Loading CSVs from {directory} for rollback...")
    cards = defaultdict(lambda: {"quantity": 0, "name": "", "set_code": "", "set_name": "", "condition": "", "foil": "", "price": 0.0, "rarity": "", "scryfall_id": ""})
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
                    condition = row.get("Condition", "NM")
                    foil = row.get("Foil", "")
                    
                    key = f"{scryfall_id}_{condition}_{foil}"
                    
                    cards[key]["quantity"] += qty
                    cards[key]["condition"] = condition
                    cards[key]["foil"] = foil
                    cards[key]["scryfall_id"] = scryfall_id
                    
    return cards

def batch_rollback(cards):
    conn = psycopg2.connect(PROD_DB_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT printing_id FROM card_printings")
    valid_ids = set(row[0] for row in cur.fetchall() if row[0])
    
    records = []
    for card in cards.values():
        p_id = card["scryfall_id"] if card["scryfall_id"] in valid_ids else None
        
        # We need to subtract the stock we accidentally added.
        # stock = GREATEST(0, stock - qty)
        records.append((
            card["quantity"], p_id, card["condition"], card["foil"]
        ))

    print(f"Rolling back {len(records)} records...")
    
    query = """
    UPDATE products 
    SET stock = GREATEST(0, stock - data.qty)
    FROM (VALUES %s) AS data(qty, printing_id, condition, finish)
    WHERE products.printing_id IS NOT DISTINCT FROM data.printing_id::uuid 
      AND products.condition = data.condition 
      AND products.finish = data.finish
    """
    
    try:
        execute_values(cur, query, records)
        conn.commit()
        print("Rollback of stock successful.")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    csv_dir = r"e:\TCG Web App\Documentación\Subida de Cartas MTG 20260616"
    cards = load_csvs(csv_dir)
    batch_rollback(cards)
