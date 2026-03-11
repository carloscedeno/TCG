import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_editions():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("--- Searching for TMNT and PZA editions ---")
        cur.execute("""
            SELECT cp.printing_id, cp.card_id, cp.set_id, s.set_code, s.set_name, cp.scryfall_id, cp.foil_price, cp.non_foil_price, cp.collector_number, c.card_name
            FROM card_printings cp
            JOIN sets s ON cp.set_id = s.set_id
            JOIN cards c ON cp.card_id = c.card_id
            WHERE s.set_code ILIKE '%TMNT%' OR s.set_code ILIKE '%PZA%' 
            LIMIT 100
        """)
        results = cur.fetchall()
        
        output_data = []
        for row in results:
            printing_id = row[0]
            scryfall_id = row[5]
            cur.execute("SELECT count(*) FROM price_history WHERE printing_id = %s", (printing_id,))
            count = cur.fetchone()[0]
            
            output_data.append({
                "type": "affected",
                "printing_id": printing_id,
                "card_id": row[1],
                "set_id": row[2],
                "set_code": row[3],
                "set_name": row[4],
                "scryfall_id": scryfall_id,
                "collector_number": row[8],
                "name": row[9],
                "foil_price": float(row[6]) if row[6] is not None else None,
                "non_foil_price": float(row[7]) if row[7] is not None else None,
                "price_history_count": count
            })



        print("--- Searching for working cards ---")
        cur.execute("""
            SELECT cp.printing_id, cp.card_id, cp.set_id, s.set_code, s.set_name, cp.scryfall_id, cp.foil_price, cp.non_foil_price 
            FROM card_printings cp
            JOIN sets s ON cp.set_id = s.set_id
            WHERE cp.non_foil_price IS NOT NULL
            LIMIT 5
        """)
        working_results = cur.fetchall()
        for row in working_results:
            printing_id = row[0]
            scryfall_id = row[5]
            cur.execute("SELECT count(*) FROM price_history WHERE printing_id = %s", (printing_id,))
            count = cur.fetchone()[0]
            
            output_data.append({
                "type": "working",
                "printing_id": printing_id,
                "card_id": row[1],
                "set_id": row[2],
                "set_code": row[3],
                "set_name": row[4],
                "scryfall_id": scryfall_id,
                "foil_price": float(row[6]) if row[6] is not None else None,
                "non_foil_price": float(row[7]) if row[7] is not None else None,
                "price_history_count": count
            })

        import json
        with open("debug_results.json", "w") as f:
            json.dump(output_data, f, indent=2)
        print("Done.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")



if __name__ == "__main__":
    check_editions()
