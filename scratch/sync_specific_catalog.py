import requests
import psycopg2
import json
from datetime import datetime, timezone

# DB Config from .env (retrieved in previous step)
DB_CONFIG = {
    "user": "postgres.sxuotvogwvmxuvwbsscv",
    "password": "jLta9LqEmpMzCI5r",
    "host": "aws-0-us-west-2.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres"
}

GAME_ID = 22

SCRYFALL_IDS = [
    "ba854032-6ad2-4654-990a-64006e7f92fd", # Pest
    "d0f3bd3d-08cf-4783-ae31-03770c8be69c", # Spirit
    "b4f61b5e-9c53-40b1-b93e-3ffa351ff052", # Treasure
    "40b22872-7b7b-4a6d-a343-4152e552b00a", # Pest
    "57b98846-85e3-47c7-a903-29953d0b0e8a", # Elemental
    "b5b2df9c-228f-4441-a962-46b335bb356e", # Elemental
    "4e119457-948d-4ef8-8c27-59fa675f766f", # Copy
    "8b5f1fdb-04df-4224-acb4-7819c37565f5", # Fractal
    "43e9f729-abaf-4000-8df5-fa46d59eff9e", # Inkling
    "bab52920-9d67-4cd4-9015-6e645ff9764f", # Inkling
    "de564776-9d88-4533-8717-842eecdd0594", # Fractal
    "ea11f546-4f7c-4649-9e6e-65d0a3ef3912"  # Dualcaster Mage
]

def load_specific_catalog():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    loaded_count = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for sid in SCRYFALL_IDS:
        print(f"Fetching {sid} from Scryfall...")
        resp = requests.get(f"https://api.scryfall.com/cards/{sid}")
        if resp.status_code != 200:
            print(f"  Error fetching {sid}: {resp.status_code}")
            continue
        
        card = resp.json()
        set_code = card['set']
        
        # 1. Ensure Set exists
        cur.execute("SELECT set_id FROM sets WHERE set_code = %s AND game_id = %s", (set_code, GAME_ID))
        row = cur.fetchone()
        if not row:
            print(f"  Set {set_code} not found. Fetching set data...")
            sresp = requests.get(f"https://api.scryfall.com/sets/{set_code}")
            if sresp.status_code == 200:
                sdata = sresp.json()
                cur.execute("""
                    INSERT INTO sets (game_id, set_name, set_code, release_date, is_digital, total_cards, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING set_id
                """, (GAME_ID, sdata['name'], sdata['code'], sdata.get('released_at'), sdata.get('digital', False), sdata.get('card_count'), now))
                set_id = cur.fetchone()[0]
            else:
                print(f"  Could not fetch set metadata for {set_code}")
                continue
        else:
            set_id = row[0]
            
        # 2. Ensure Card exists
        oracle_id = card.get('oracle_id')
        if not oracle_id and 'card_faces' in card:
            oracle_id = card['card_faces'][0].get('oracle_id')
            
        cur.execute("SELECT 1 FROM cards WHERE card_id = %s", (oracle_id,))
        if not cur.fetchone():
            print(f"  Inserting base card {card['name']} ({oracle_id})...")
            # Minimal mapping for visibility
            oracle_text = card.get('oracle_text')
            type_line = card.get('type_line')
            mana_cost = card.get('mana_cost')
            if 'card_faces' in card and not oracle_text:
                oracle_text = " // ".join([f.get('oracle_text', '') for f in card['card_faces']])
            if 'card_faces' in card and not type_line:
                type_line = " // ".join([f.get('type_line', '') for f in card['card_faces']])
            if 'card_faces' in card and not mana_cost:
                mana_cost = " // ".join([f.get('mana_cost', '') for f in card['card_faces']])

            cur.execute("""
                INSERT INTO cards (card_id, game_id, card_name, type_line, oracle_text, mana_cost, rarity, colors, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (card_id) DO NOTHING
            """, (oracle_id, GAME_ID, card['name'], type_line, oracle_text, mana_cost, card.get('rarity'), card.get('colors', []), now))
            
        # 3. Insert/Update Printing
        image_url = card.get('image_uris', {}).get('normal')
        if not image_url and 'card_faces' in card:
            if 'image_uris' in card['card_faces'][0]:
                image_url = card['card_faces'][0]['image_uris'].get('normal')
            else:
                image_url = card['image_uris'].get('normal') # Fallback
                
        print(f"  Upserting printing {card['name']} (#{card.get('collector_number')})...")
        cur.execute("""
            INSERT INTO card_printings 
                (printing_id, scryfall_id, card_id, set_id, set_code, collector_number, image_url, prices, card_faces, rarity, artist, updated_at)
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (printing_id) DO UPDATE SET
                prices = EXCLUDED.prices,
                image_url = EXCLUDED.image_url,
                updated_at = EXCLUDED.updated_at
        """, (
            card['id'], 
            card['id'], 
            oracle_id, 
            set_id, 
            card['set'], 
            card.get('collector_number'), 
            image_url, 
            json.dumps(card.get('prices', {})), 
            json.dumps(card.get('card_faces')) if 'card_faces' in card else None,
            card.get('rarity'),
            card.get('artist'),
            now
        ))
        
        loaded_count += 1
        
    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✨ Finished! Successfully synced {loaded_count} catalog items.")

if __name__ == "__main__":
    load_specific_catalog()
