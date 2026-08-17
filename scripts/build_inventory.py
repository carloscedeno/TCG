import json
import csv
import io

csv_data = """Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency,Added
Firja, Judge of Valor,KHM,Kaldheim,322,normal,uncommon,1,57007,9ec8cdd5-e55b-40e0-a61e-f28890f5628d,0.35,false,false,near_mint,en,USD,2026-08-13T17:06:31.785Z
Savvy Hunter,ELD,Throne of Eldraine,200,normal,uncommon,1,46138,15c98441-2b31-4e48-a399-f36dffcfa41d,0.49,false,false,near_mint,en,USD,2026-08-13T17:06:31.846Z
Fanatic of Xenagos,BNG,Born of the Gods,147,normal,uncommon,1,14813,3687799c-81bd-4c49-902a-2a96863629c3,0.35,false,false,near_mint,en,USD,2026-08-13T17:06:31.881Z
Hellhole Flailer,RTR,Return to Ravnica,167,normal,uncommon,1,17255,4984a089-84af-4387-9a0d-819b119b5565,0.35,false,false,near_mint,en,USD,2026-08-13T17:06:31.942Z
Aegar, the Freezing Flame,KHM,Kaldheim,321,normal,uncommon,1,57140,edac3fd7-8124-4614-ae50-651608d45adb,0.35,false,false,near_mint,en,USD,2026-08-13T17:06:32.003Z
Aegar, the Freezing Flame,KHM,Kaldheim,321,foil,uncommon,1,57140,edac3fd7-8124-4614-ae50-651608d45adb,0.49,false,false,near_mint,en,USD,2026-08-13T17:06:32.004Z
Narfi, Betrayer King,KHM,Kaldheim,329,normal,uncommon,1,56853,46ecbec4-0f29-4795-a16c-15e7ca55af4f,0.35,false,false,near_mint,en,USD,2026-08-13T17:06:32.040Z
Raven Wings,KHM,Kaldheim,243,normal,common,4,56902,60916ebe-6d84-4873-bd91-351bbe219c57,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:24.592Z
Cultist's Staff,EMN,Eldritch Moon,194,normal,common,1,8140,8da8c523-44e8-43e7-8431-28dbed1015ac,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:24.627Z
Sleek Schooner,XLN,Ixalan,247,normal,uncommon,1,3765,767e2bfb-bcf5-442c-b092-bdb1f4f13561,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:24.708Z
Junktroller,RNA,Ravnica Allegiance,235,normal,uncommon,1,43630,03fd8ee5-0a2a-4c68-9b09-01945c7189ab,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:24.782Z
Roving Keep,ELD,Throne of Eldraine,228,normal,common,1,46110,38a0136e-a637-4a12-a38f-35f772b290a9,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:24.848Z
Simian Brawler,CSP,Coldsnap,122,normal,common,1,27119,df2ed9f3-50b1-493b-9c14-0f8ddb4d8c57,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:25.131Z
Spirit of the Aldergard,KHM,Kaldheim,195,normal,uncommon,1,56781,220df551-3820-4910-a206-14501ba02e69,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:25.140Z
Bomat Bazaar Barge,KLD,Kaladesh,198,normal,uncommon,2,7445,0f32be75-979d-43a9-9132-2cf013ddaf3b,0.35,false,false,near_mint,en,USD,2026-08-13T18:26:24.786Z
Stampeding Rhino,M10,Magic 2010,204,normal,common,1,23149,f5a33394-d26c-4dcd-948c-e7d370059b11,0.35,false,false,near_mint,en,USD,2026-08-13T19:11:03.579Z
Tajuru Pathwarden,OGW,Oath of the Gatewatch,145,normal,common,1,9237,b073e75b-b432-41a5-a71e-d169fecf774f,0.35,false,false,near_mint,en,USD,2026-08-13T19:11:03.616Z
Arachnoform,KHM,Kaldheim,159,normal,common,4,57037,acbe560b-f7b5-4614-91f1-b669a39abc16,0.35,false,false,near_mint,en,USD,2026-08-13T19:47:30.352Z
Plummet,M13,Magic 2013,179,normal,common,2,17644,a96d7d96-5a86-45ef-a30b-b11ece22f060,0.35,false,false,near_mint,en,USD,2026-08-13T19:47:30.321Z
Plague Fiend,PCY,Prophecy,73,normal,common,2,33607,11f077f5-c0b0-4e94-8599-e2122bc87238,0.35,false,false,near_mint,en,USD,2026-08-13T20:37:31.243Z
Restless Dead,MIR,Mirage,138,normal,common,2,38452,a237cff4-af6f-4745-bda1-e3ed2267fa89,0.35,false,false,near_mint,en,USD,2026-08-13T20:37:31.252Z
Harvester Druid,JUD,Judgment,120,normal,common,2,31478,97337e6e-1b3f-43a2-91f2-ca8f6c5dea88,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.568Z
Krosan Avenger,ODY,Odyssey,247,normal,common,6,31930,0afd6911-32b5-410a-afb0-fd3d2996fe59,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.582Z
Elite Cat Warrior,POR,Portal,163†,normal,common,1,37389,70a4d16b-5bfc-4e35-8a8e-16cf84f54586,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.604Z
Anaconda,POR,Portal,158†,normal,uncommon,1,37395,6ffba7a5-8845-46f4-bb86-4722d6cbd4c1,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.639Z
Serpentine Kavu,INV,Invasion,211,normal,common,4,33122,699f1fe8-02c6-4d95-9231-3f8aefe603da,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.650Z
Thrive,PCY,Prophecy,129,normal,common,2,33551,9cb20099-fc53-4fdf-86f4-d7d8155c2af1,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.772Z
Druid Lyrist,ODY,Odyssey,238,normal,common,6,31939,e9923532-bc4f-44de-b963-d6914321c49a,0.35,false,false,near_mint,en,USD,2026-08-13T23:47:34.523Z
Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency,Added
Lim-Dûl's High Guard,DKM,Deckmasters,6b,normal,common,1,31820,692c668d-3061-4bdf-921f-94af32b4878c,0.35,false,false,near_mint,en,USD,2026-08-13T21:25:26.207Z
Bog Witch,MMQ,Mercadian Masques,118,normal,common,2,34292,6a926f9e-ee63-4b6e-8e5b-0650b74344a5,0.99,false,false,near_mint,en,USD,2026-08-13T21:25:26.212Z
Alley Grifters,MMQ,Mercadian Masques,115,normal,common,1,34295,cfb648e3-f5ad-4b33-afa3-d4cda0d369a1,0.35,false,false,near_mint,en,USD,2026-08-13T21:25:26.226Z
Phyrexian Slayer,INV,Invasion,118,normal,common,2,33215,5fa8c604-343f-4c94-ac25-439ab1845c19,0.35,false,false,near_mint,en,USD,2026-08-13T21:25:26.248Z
Grotesque Hybrid,TOR,Torment,63,normal,uncommon,1,31678,6b063c3a-267f-4f22-be51-0a14880afc24,0.35,false,false,near_mint,en,USD,2026-08-13T21:25:26.291Z
Urborg Drake,INV,Invasion,283,normal,uncommon,2,33050,97d1327e-bf87-423f-8a04-8124e45b9ae0,0.35,false,false,near_mint,en,USD,2026-08-13T21:25:26.370Z
Hand of Death,POR,Portal,96†,normal,common,1,37460,64afd70a-cde2-4980-9ec9-275e6198b40f,0.35,false,false,near_mint,en,USD,2026-08-13T21:25:26.426Z
Blaster Mage,MMQ,Mercadian Masques,175,normal,common,1,34235,801b0fd1-bbb2-47c0-a4c3-4129a67473b9,0.35,false,false,near_mint,en,USD,2026-08-13T22:09:40.267Z
Raging Goblin,POR,Portal,145†,normal,common,2,37409,6c0fa444-5534-4476-8bfa-78b2364f2dd3,0.35,false,false,near_mint,en,USD,2026-08-13T22:09:40.198Z
Glittering Lynx,PCY,Prophecy,11,normal,common,4,33669,a3f26c7e-c525-4191-a542-b81343ae95bb,0.35,false,false,near_mint,en,USD,2026-08-13T22:29:14.461Z
Helionaut,APC,Apocalypse,13,normal,common,3,32443,3a4d395e-d7d6-4e93-9761-b0bae63b7b1c,0.35,false,false,near_mint,en,USD,2026-08-13T22:29:14.514Z
Off Balance,NEM,Nemesis,15,normal,common,1,33867,adafe5c4-8de0-4d38-919f-de96bc70c21b,0.35,false,false,near_mint,en,USD,2026-08-13T23:10:11.181Z
Pacifism,6ED,Classic Sixth Edition,33,normal,common,1,35344,132d0ac2-08aa-4f3b-9616-006c0bf09f59,0.35,false,false,near_mint,en,USD,2026-08-13T23:10:11.195Z
Embolden,ODY,Odyssey,22,normal,common,7,32155,36848fb0-4070-40cf-b24a-2e8f47c5ebc3,0.35,false,false,near_mint,en,USD,2026-08-13T23:10:11.231Z
Warrior's Charge,POR,Portal,38†,normal,common,1,37519,9279d545-28b7-41c5-bb88-6dc4bbbcd71f,0.35,false,false,near_mint,en,USD,2026-08-13T23:10:11.250Z"""

lines = [line for line in csv_data.split('\n') if line.strip()]

# Re-assemble the CSV properly, filtering out the extra header lines
clean_lines = []
for line in lines:
    if line.startswith('Name,Set code'):
        continue
    clean_lines.append(line)

json_list = []
for line in clean_lines:
    parts = line.split(',')
    
    added = parts[-1]
    currency = parts[-2]
    language = parts[-3]
    condition = parts[-4]
    altered = parts[-5]
    misprint = parts[-6]
    price = parts[-7]
    scryfall_id = parts[-8]
    manabox_id = parts[-9]
    quantity = parts[-10]
    rarity = parts[-11]
    foil = parts[-12]
    collector_number = parts[-13]
    set_name = parts[-14]
    set_code = parts[-15]
    name = ",".join(parts[:-15])
    
    if condition == 'near_mint':
        condition = 'NM'
        
    finish = 'foil' if foil == 'foil' else 'nonfoil'
    
    item = {
        "name": name.strip('"').strip(),
        "set_code": set_code,
        "collector_number": str(collector_number),
        "scryfall_id": scryfall_id,
        "quantity": int(quantity),
        "price": float(price),
        "condition": condition,
        "finish": finish
    }
    json_list.append(item)

json_str = json.dumps(json_list).replace("'", "''")
sql = f"SELECT public.bulk_import_inventory('{json_str}'::jsonb);"
with open("temp_inventory.sql", "w", encoding="utf-8") as f:
    f.write(sql)

print("SQL generated")
