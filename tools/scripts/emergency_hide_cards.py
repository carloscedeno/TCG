import os
import csv
from collections import defaultdict
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

PROD_DB_URL = "postgresql://postgres.sxuotvogwvmxuvwbsscv:jLta9LqEmpMzCI5r@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def load_csvs(directory):
    cards = defaultdict(lambda: {"quantity": 0, "condition": "", "foil": "", "scryfall_id": ""})
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
                    cards[key]["condition"] = condition
                    cards[key]["foil"] = foil
                    cards[key]["scryfall_id"] = scryfall_id
                    
    return cards

def emergency_hide(cards):
    conn = psycopg2.connect(PROD_DB_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT printing_id FROM card_printings")
    valid_ids = set(row[0] for row in cur.fetchall() if row[0])
    
    records = []
    for card in cards.values():
        p_id = card["scryfall_id"] if card["scryfall_id"] in valid_ids else None
        records.append((p_id, card["condition"], card["foil"]))

    print(f"Hiding {len(records)} records by setting stock to 0...")
    
    query = """
    UPDATE products 
    SET stock = 0
    FROM (VALUES %s) AS data(printing_id, condition, finish)
    WHERE products.printing_id IS NOT DISTINCT FROM data.printing_id::uuid 
      AND products.condition = data.condition 
      AND products.finish = data.finish
    """
    
    try:
        execute_values(cur, query, records)
        conn.commit()
        print("Emergency hide successful.")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    csv_dir = r"e:\TCG Web App\Documentación\Subida de Cartas MTG 20260616"
    cards = load_csvs(csv_dir)
    emergency_hide(cards)
