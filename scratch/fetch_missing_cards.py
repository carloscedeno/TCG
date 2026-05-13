
import requests
import json
import time

scryfall_ids = [
    "25fca5a7-3b61-4e1e-83a3-a312c06fd922", # Marit Lage
    "f629bba8-e2ef-4d1c-8f64-339879289a6d", # The Monarch
    "b50bfde2-6c2d-403e-ab47-c932bcb2116d", # Otherworldly Escort
    "d763695b-c184-409d-962d-5aaf39a6264e", # Feather, Radiant Arbiter
    "878fcea5-9a59-4b98-80b8-67e95f35f949", # Castle Ardenvale
    "a3879b81-aa4c-4d35-bed2-78ebb4a50b59", # Solemn Simulacrum
    "332280f7-03af-4ef8-b1ff-5ac5e4d3b3ce", # Sun Titan
    "e593bb16-e709-4d92-bf6f-239f6a11f7db", # Arcane Signet (MKC)
    "46dc2519-2729-4bbd-8892-fab6186bf116", # Elspeth, Sun's Champion
    "a30947a1-b25a-4570-b36c-75c4e9689abd", # Orzhov Advokist
    "1666cae8-8750-4091-8e45-259e76268db9", # Faerie Rogue
    "2ef58a8f-ce72-40c2-b032-818cc16267ce", # Insatiable Frugivore
    "16e8e655-2da1-46c9-b9fb-223dd366698b", # Chittering Witch
    "b70293ae-d50d-44bf-aaa3-689727056ec5", # Ogre Slumlord
    "13158f3b-9d85-4689-9afa-7d9a8a2d1b09", # Moonstone Eulogist
    "d8f4d07b-2fc1-4d86-865b-b35526850c8e", # Maelstrom Pulse
    "c579edb6-acba-4e44-b3d6-693cd4e0e2d8", # Casualties of War
    "27e36ac4-797e-4873-a8ff-7f256b744680", # Time Wipe
    "f0b80608-1455-4899-9d19-1b1d2d068744", # Chitterspitter
    "00756441-a734-4960-9c69-f03a508a1522", # Rootcast Apprenticeship
    "e99c4fec-eb21-4288-a12f-1c58c4946bae", # Fellwar Stone
    "28180667-cc1e-4f64-9a69-00425ef85ba0", # Arcane Signet (BLC)
    "e62ff2bf-323d-4252-ba7b-27bcdf805093", # Ramunap Excavator
    "c298d757-6d9d-4d33-86b6-e198299859be"  # Force of Despair
]

def fetch_cards():
    results = []
    for sid in scryfall_ids:
        print(f"Fetching {sid}...")
        resp = requests.get(f"https://api.scryfall.com/cards/{sid}")
        if resp.status_code == 200:
            results.append(resp.json())
        else:
            print(f"Error fetching {sid}: {resp.status_code}")
        time.sleep(0.1)
    
    with open("e:/TCG Web App/scratch/scryfall_data.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    fetch_cards()
