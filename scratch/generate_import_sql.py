
import json
import uuid

# User data
user_data = [
    {"name": "Marit Lage", "set_code": "TM3C", "collector_number": "11", "finish": "nonfoil", "quantity": 1, "scryfall_id": "25fca5a7-3b61-4e1e-83a3-a312c06fd922", "condition": "NM", "price": 0.0},
    {"name": "The Monarch", "set_code": "TECC", "collector_number": "12", "finish": "nonfoil", "quantity": 2, "scryfall_id": "f629bba8-e2ef-4d1c-8f64-339879289a6d", "condition": "NM", "price": 0.0},
    {"name": "Otherworldly Escort", "set_code": "MKC", "collector_number": "12", "finish": "nonfoil", "quantity": 1, "scryfall_id": "b50bfde2-6c2d-403e-ab47-c932bcb2116d", "condition": "NM", "price": 0.49},
    {"name": "Feather, Radiant Arbiter", "set_code": "MKC", "collector_number": "6", "finish": "foil", "quantity": 1, "scryfall_id": "d763695b-c184-409d-962d-5aaf39a6264e", "condition": "NM", "price": 0.99},
    {"name": "Castle Ardenvale", "set_code": "MKC", "collector_number": "253", "finish": "nonfoil", "quantity": 1, "scryfall_id": "878fcea5-9a59-4b98-80b8-67e95f35f949", "condition": "NM", "price": 0.69},
    {"name": "Solemn Simulacrum", "set_code": "MKC", "collector_number": "238", "finish": "nonfoil", "quantity": 1, "scryfall_id": "a3879b81-aa4c-4d35-bed2-78ebb4a50b59", "condition": "NM", "price": 0.49},
    {"name": "Sun Titan", "set_code": "NCC", "collector_number": "210", "finish": "nonfoil", "quantity": 1, "scryfall_id": "332280f7-03af-4ef8-b1ff-5ac5e4d3b3ce", "condition": "NM", "price": 0.99},
    {"name": "Arcane Signet", "set_code": "MKC", "collector_number": "223", "finish": "nonfoil", "quantity": 1, "scryfall_id": "e593bb16-e709-4d92-bf6f-239f6a11f7db", "condition": "NM", "price": 0.99},
    {"name": "Elspeth, Sun's Champion", "set_code": "MKC", "collector_number": "62", "finish": "nonfoil", "quantity": 1, "scryfall_id": "46dc2519-2729-4bbd-8892-fab6186bf116", "condition": "NM", "price": 2.79},
    {"name": "Orzhov Advokist", "set_code": "MKC", "collector_number": "77", "finish": "nonfoil", "quantity": 1, "scryfall_id": "a30947a1-b25a-4570-b36c-75c4e9689abd", "condition": "NM", "price": 0.39},
    {"name": "Faerie Rogue", "set_code": "TMOR", "collector_number": "2", "finish": "nonfoil", "quantity": 2, "scryfall_id": "1666cae8-8750-4091-8e45-259e76268db9", "condition": "NM", "price": 2.79},
    {"name": "Insatiable Frugivore", "set_code": "BLC", "collector_number": "18", "finish": "nonfoil", "quantity": 1, "scryfall_id": "2ef58a8f-ce72-40c2-b032-818cc16267ce", "condition": "NM", "price": 0.49},
    {"name": "Chittering Witch", "set_code": "BLC", "collector_number": "180", "finish": "nonfoil", "quantity": 1, "scryfall_id": "16e8e655-2da1-46c9-b9fb-223dd366698b", "condition": "NM", "price": 0.49},
    {"name": "Ogre Slumlord", "set_code": "BLC", "collector_number": "186", "finish": "nonfoil", "quantity": 1, "scryfall_id": "b70293ae-d50d-44bf-aaa3-689727056ec5", "condition": "NM", "price": 0.69},
    {"name": "Moonstone Eulogist", "set_code": "BLC", "collector_number": "19", "finish": "nonfoil", "quantity": 1, "scryfall_id": "13158f3b-9d85-4689-9afa-7d9a8a2d1b09", "condition": "NM", "price": 0.49},
    {"name": "Maelstrom Pulse", "set_code": "BLC", "collector_number": "126", "finish": "nonfoil", "quantity": 1, "scryfall_id": "d8f4d07b-2fc1-4d86-865b-b35526850c8e", "condition": "NM", "price": 0.49},
    {"name": "Casualties of War", "set_code": "BLC", "collector_number": "125", "finish": "nonfoil", "quantity": 1, "scryfall_id": "c579edb6-acba-4e44-b3d6-693cd4e0e2d8", "condition": "NM", "price": 0.49},
    {"name": "Time Wipe", "set_code": "BLC", "collector_number": "262", "finish": "nonfoil", "quantity": 1, "scryfall_id": "27e36ac4-797e-4873-a8ff-7f256b744680", "condition": "NM", "price": 0.49},
    {"name": "Chitterspitter", "set_code": "BLC", "collector_number": "211", "finish": "nonfoil", "quantity": 1, "scryfall_id": "f0b80608-1455-4899-9d19-1b1d2d068744", "condition": "NM", "price": 0.49},
    {"name": "Rootcast Apprenticeship", "set_code": "BLC", "collector_number": "32", "finish": "nonfoil", "quantity": 1, "scryfall_id": "00756441-a734-4960-9c69-f03a508a1522", "condition": "NM", "price": 0.99},
    {"name": "Fellwar Stone", "set_code": "BLC", "collector_number": "269", "finish": "nonfoil", "quantity": 1, "scryfall_id": "e99c4fec-eb21-4288-a12f-1c58c4946bae", "condition": "NM", "price": 1.79},
    {"name": "Arcane Signet", "set_code": "BLC", "collector_number": "127", "finish": "nonfoil", "quantity": 1, "scryfall_id": "28180667-cc1e-4f64-9a69-00425ef85ba0", "condition": "NM", "price": 1.29},
    {"name": "Ramunap Excavator", "set_code": "PHOU", "collector_number": "129", "finish": "foil", "quantity": 1, "scryfall_id": "e62ff2bf-323d-4252-ba7b-27bcdf805093", "condition": "NM", "price": 5.99},
    {"name": "Force of Despair", "set_code": "SLP", "collector_number": "29", "finish": "nonfoil", "quantity": 1, "scryfall_id": "c298d757-6d9d-4d33-86b6-e198299859be", "condition": "NM", "price": 5.99}
]

with open("e:/TCG Web App/scratch/scryfall_data.json", "r", encoding='utf-8') as f:
    sf_data = json.load(f)

image_lookup = {}
for card in sf_data:
    url = card.get('image_uris', {}).get('normal', '')
    if not url and 'card_faces' in card:
        url = card['card_faces'][0].get('image_uris', {}).get('normal', '')
    image_lookup[card['id']] = url

sql_statements = []
next_set_id = 9000
set_map = {}
existing_sets = {'blc', 'm3c', 'mh3', 'mkc', 'ncc', 'phou', 'slp'}

sql_statements.append("BEGIN;")

# 1. Sets
for card in sf_data:
    set_code = card['set'].lower()
    if set_code not in existing_sets and set_code not in set_map:
        set_map[set_code] = next_set_id
        next_set_id += 1
        set_name = card['set_name'].replace("'", "''")
        sql_statements.append(f"INSERT INTO sets (set_id, game_id, set_name, set_code, release_date) VALUES ({set_map[set_code]}, 22, '{set_name}', '{set_code}', NOW()) ON CONFLICT (game_id, set_code) DO NOTHING;")

# 2. Cards
for card in sf_data:
    oracle_id = card['oracle_id']
    name = card['name'].replace("'", "''")
    type_line = card.get('type_line', '').replace("'", "''")
    oracle_text = card.get('oracle_text', '').replace("'", "''")
    mana_cost = card.get('mana_cost', '').replace("'", "''")
    rarity = card.get('rarity', '')
    sql_statements.append(f"INSERT INTO cards (card_id, game_id, card_name, type_line, oracle_text, mana_cost, rarity) VALUES ('{oracle_id}', 22, '{name}', '{type_line}', '{oracle_text}', '{mana_cost}', '{rarity}') ON CONFLICT (card_id) DO NOTHING;")

# 3. Printings
for card in sf_data:
    printing_id = card['id']
    oracle_id = card['oracle_id']
    set_code = card['set'].lower()
    col_num = card['collector_number']
    image_url = image_lookup[printing_id]
    rarity = card.get('rarity', '')
    if set_code in set_map:
        set_id_expr = str(set_map[set_code])
    else:
        set_id_expr = f"(SELECT set_id FROM sets WHERE LOWER(set_code) = '{set_code}' LIMIT 1)"
    sql_statements.append(f"INSERT INTO card_printings (printing_id, card_id, set_id, set_code, collector_number, rarity, image_url, scryfall_id, is_foil, finishes) VALUES ('{printing_id}', '{oracle_id}', {set_id_expr}, '{set_code}', '{col_num}', '{rarity}', '{image_url}', '{printing_id}', {str(card.get('foil', False)).lower()}, ARRAY['{card.get('finishes', ['nonfoil'])[0]}']) ON CONFLICT (printing_id) DO NOTHING;")

# 4. Products - Using ON CONFLICT ON CONSTRAINT
for item in user_data:
    scryfall_id = item['scryfall_id']
    name = item['name'].replace("'", "''")
    set_code = item['set_code'].lower()
    price = item['price']
    stock = item['quantity']
    condition = item['condition']
    finish = item['finish']
    image_url = image_lookup.get(scryfall_id, '')
    
    sql_statements.append(f"INSERT INTO products (id, name, game, set_code, price, stock, printing_id, condition, finish, image_url) VALUES (gen_random_uuid(), '{name}', 'MTG', '{set_code}', {price}, {stock}, '{scryfall_id}', '{condition}', '{finish}', '{image_url}') ON CONFLICT ON CONSTRAINT products_printing_id_condition_finish_key DO UPDATE SET stock = products.stock + {stock}, price = CASE WHEN {price} > 0 THEN {price} ELSE products.price END;")

sql_statements.append("COMMIT;")

with open("e:/TCG Web App/scratch/import_missing.sql", "w", encoding='utf-8') as f:
    f.write("\n".join(sql_statements))
