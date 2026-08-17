import requests
import json
import time

ids = [
    "9ec8cdd5-e55b-40e0-a61e-f28890f5628d",
    "15c98441-2b31-4e48-a399-f36dffcfa41d",
    "3687799c-81bd-4c49-902a-2a96863629c3",
    "4984a089-84af-4387-9a0d-819b119b5565",
    "edac3fd7-8124-4614-ae50-651608d45adb",
    "46ecbec4-0f29-4795-a16c-15e7ca55af4f",
    "60916ebe-6d84-4873-bd91-351bbe219c57",
    "8da8c523-44e8-43e7-8431-28dbed1015ac",
    "767e2bfb-bcf5-442c-b092-bdb1f4f13561",
    "03fd8ee5-0a2a-4c68-9b09-01945c7189ab",
    "38a0136e-a637-4a12-a38f-35f772b290a9",
    "df2ed9f3-50b1-493b-9c14-0f8ddb4d8c57",
    "220df551-3820-4910-a206-14501ba02e69",
    "0f32be75-979d-43a9-9132-2cf013ddaf3b",
    "f5a33394-d26c-4dcd-948c-e7d370059b11",
    "b073e75b-b432-41a5-a71e-d169fecf774f",
    "acbe560b-f7b5-4614-91f1-b669a39abc16",
    "a96d7d96-5a86-45ef-a30b-b11ece22f060",
    "11f077f5-c0b0-4e94-8599-e2122bc87238",
    "a237cff4-af6f-4745-bda1-e3ed2267fa89",
    "97337e6e-1b3f-43a2-91f2-ca8f6c5dea88",
    "0afd6911-32b5-410a-afb0-fd3d2996fe59",
    "70a4d16b-5bfc-4e35-8a8e-16cf84f54586",
    "6ffba7a5-8845-46f4-bb86-4722d6cbd4c1",
    "699f1fe8-02c6-4d95-9231-3f8aefe603da",
    "9cb20099-fc53-4fdf-86f4-d7d8155c2af1",
    "e9923532-bc4f-44de-b963-d6914321c49a",
    "692c668d-3061-4bdf-921f-94af32b4878c",
    "6a926f9e-ee63-4b6e-8e5b-0650b74344a5",
    "cfb648e3-f5ad-4b33-afa3-d4cda0d369a1",
    "5fa8c604-343f-4c94-ac25-439ab1845c19",
    "6b063c3a-267f-4f22-be51-0a14880afc24",
    "97d1327e-bf87-423f-8a04-8124e45b9ae0",
    "64afd70a-cde2-4980-9ec9-275e6198b40f",
    "801b0fd1-bbb2-47c0-a4c3-4129a67473b9",
    "6c0fa444-5534-4476-8bfa-78b2364f2dd3",
    "a3f26c7e-c525-4191-a542-b81343ae95bb",
    "3a4d395e-d7d6-4e93-9761-b0bae63b7b1c",
    "adafe5c4-8de0-4d38-919f-de96bc70c21b",
    "132d0ac2-08aa-4f3b-9616-006c0bf09f59",
    "36848fb0-4070-40cf-b24a-2e8f47c5ebc3",
    "9279d545-28b7-41c5-bb88-6dc4bbbcd71f"
]

sql_statements = []

for scryfall_id in ids:
    url = f"https://api.scryfall.com/cards/{scryfall_id}"
    headers = {'User-Agent': 'GeekoriumApp/1.0', 'Accept': '*/*'}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to fetch {scryfall_id}")
        continue
    data = resp.json()
    
    card_id = data.get("oracle_id")
    printing_id = data.get("id")
    card_name = data.get("name").replace("'", "''")
    set_code = data.get("set")
    rarity = data.get("rarity")
    collector_number = data.get("collector_number")
    is_foil = str(data.get("foil", False)).lower()
    
    # insert into cards
    sql_statements.append(f"""
INSERT INTO public.cards (card_id, card_name, rarity) 
VALUES ('{card_id}', '{card_name}', '{rarity}') 
ON CONFLICT (card_id) DO NOTHING;
""")
    
    # insert into card_printings
    sql_statements.append(f"""
INSERT INTO public.card_printings (printing_id, card_id, set_code, scryfall_id, collector_number, rarity, is_foil) 
VALUES ('{printing_id}', '{card_id}', '{set_code}', '{scryfall_id}', '{collector_number}', '{rarity}', {is_foil})
ON CONFLICT (printing_id) DO NOTHING;
""")
    time.sleep(0.1) # rate limit

with open("temp_insert.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_statements))

print("SQL generated in temp_insert.sql")
