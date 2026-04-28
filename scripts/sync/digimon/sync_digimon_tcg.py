import sys
import os
import requests
import json
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Add common directory to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent))

from common.db import setup_logging

# Initialize logger
logger = setup_logging("DIGIMON")

# Configuration
DIGIMON_API_URL = "https://digimoncard.io/api-public/getAllCards.php?sort=name&series=Digimon%20Card%20Game&sortorder=asc"
GAME_ID = 18
GAME_CODE = "DGM"

# Supabase Config (from environment or fallback to detected dev key)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bqfkqnnostzaqueujdms.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
# Using the key found in sync_data_api.py as emergency fallback for dev
if not SUPABASE_KEY or SUPABASE_KEY == "placeholder_anon_key":
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def fetch_digimon_cards() -> List[Dict[str, Any]]:
    """Fetch all cards from the Digimon TCG API."""
    logger.info("Fetching all cards from Digimon TCG API...")
    try:
        # We use a broader search to get more details if needed, 
        # but getAllCards.php with series filter is efficient.
        response = requests.get(DIGIMON_API_URL)
        response.raise_for_status()
        cards = response.json()
        logger.info(f"Fetched {len(cards)} cards from Digimon API.")
        return cards
    except Exception as e:
        logger.error(f"Error fetching from Digimon API: {e}")
        return []

def get_or_create_source() -> str:
    """Ensure the Digimon API source exists in the DB."""
    source_payload = {
        "source_name": "Digimon TCG API (digimoncard.io)",
        "source_code": "DIGIMON_API"
    }
    
    # Try to find it first
    url = f"{SUPABASE_URL}/rest/v1/sources?source_code=eq.DIGIMON_API&select=source_id"
    r = requests.get(url, headers=HEADERS)
    if r.status_code == 200 and r.json():
        return r.json()[0]["source_id"]
    
    # Create it
    r = requests.post(f"{SUPABASE_URL}/rest/v1/sources", headers=HEADERS, json=source_payload)
    if r.status_code in [201, 204]:
        # Fetch again to get the ID
        r = requests.get(url, headers=HEADERS)
        return r.json()[0]["source_id"]
    
    logger.error(f"Failed to ensure source exists: {r.text}")
    return None

def sync_digimon_data(cards: List[Dict[str, Any]]):
    """Sync Digimon cards into the Supabase database."""
    source_id = get_or_create_source()
    if not source_id:
        logger.error("Cannot proceed without a valid source_id.")
        return

    logger.info(f"Processing {len(cards)} Digimon cards...")
    
    # Step 1: Extract and sync sets
    sets_map = {} # set_name -> set_id
    for card in cards:
        set_names = card.get("set_name", [])
        if isinstance(set_names, str): set_names = [set_names]
        
        for s_name in set_names:
            if s_name not in sets_map:
                # Basic set code extraction (e.g. "BT-01" from "BT-01: Booster New Evolution")
                s_code = s_name.split(":")[0].strip() if ":" in s_name else s_name[:10]
                
                set_payload = {
                    "game_id": GAME_ID,
                    "set_code": s_code,
                    "set_name": s_name,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                # UPSERT Set
                res = requests.post(
                    f"{SUPABASE_URL}/rest/v1/sets", 
                    headers=HEADERS, 
                    json=set_payload
                )
                
                if res.status_code in [201, 204, 200]:
                    # Get the UUID
                    get_url = f"{SUPABASE_URL}/rest/v1/sets?set_code=eq.{s_code}&game_id=eq.{GAME_ID}&select=set_id"
                    s_res = requests.get(get_url, headers=HEADERS)
                    if s_res.status_code == 200 and s_res.json():
                        sets_map[s_name] = s_res.json()[0]["set_id"]
                else:
                    logger.warning(f"Failed to sync set {s_name}: {res.text}")

    # Step 2: Sync Cards and Printings
    for card in cards:
        card_name = card.get("name")
        card_number = card.get("cardnumber") or card.get("id")
        
        # Build TCG specific attributes
        tcg_attributes = {
            "type": card.get("type"),
            "color": card.get("color"),
            "color2": card.get("color2"),
            "level": card.get("level"),
            "play_cost": card.get("play_cost"),
            "evolution_cost": card.get("evolution_cost"),
            "dp": card.get("dp"),
            "attribute": card.get("attribute"),
            "digi_type": card.get("digi_type"),
            "main_effect": card.get("main_effect"),
            "source_effect": card.get("source_effect")
        }
        
        # UPSERT Card (Base record)
        # Note: In our schema, we use game_id + card_name as a pseudo-key for cards table
        card_payload = {
            "game_id": GAME_ID,
            "card_name": card_name,
            "tcg_specific_attributes": tcg_attributes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # We need the card_id (UUID)
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/cards",
            headers=HEADERS,
            json=card_payload
        )
        
        # Fetch card_id
        get_card_url = f"{SUPABASE_URL}/rest/v1/cards?card_name=eq.{requests.utils.quote(card_name)}&game_id=eq.{GAME_ID}&select=card_id"
        c_res = requests.get(get_card_url, headers=HEADERS)
        if not (c_res.status_code == 200 and c_res.json()):
            logger.error(f"Could not find/create card {card_name}")
            continue
            
        card_uuid = c_res.json()[0]["card_id"]
        
        # Sync Printings
        set_names = card.get("set_name", [])
        if isinstance(set_names, str): set_names = [set_names]
        
        for s_name in set_names:
            set_uuid = sets_map.get(s_name)
            if not set_uuid: continue
            
            # Printing Payload
            printing_payload = {
                "card_id": card_uuid,
                "set_id": set_uuid,
                "set_code": s_name.split(":")[0].strip() if ":" in s_name else s_name[:10],
                "collector_number": card_number,
                "rarity": card.get("rarity"),
                "image_url": f"https://images.digimoncard.io/images/cards/{card_number}.jpg", # standard pattern
                "is_foil": False, # Digimon standard sync is non-foil usually
                "is_non_foil": True,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "tcg_specific_printing_attributes": {
                    "digimon_card_id": card_number,
                    "pretty_url": card.get("pretty_url")
                }
            }
            
            # UPSERT Printing
            p_res = requests.post(
                f"{SUPABASE_URL}/rest/v1/card_printings",
                headers=HEADERS,
                json=printing_payload
            )
            
            if p_res.status_code not in [200, 201, 204]:
                logger.warning(f"Error syncing printing for {card_name} in {s_name}: {p_res.text}")
            else:
                # Fetch printing_id for external_identifiers
                p_get_url = f"{SUPABASE_URL}/rest/v1/card_printings?card_id=eq.{card_uuid}&set_id=eq.{set_uuid}&collector_number=eq.{card_number}&select=printing_id"
                p_id_res = requests.get(p_get_url, headers=HEADERS)
                if p_id_res.status_code == 200 and p_id_res.json():
                    printing_id = p_id_res.json()[0]["printing_id"]
                    
                    # Sync External Identifier
                    ext_payload = {
                        "printing_id": printing_id,
                        "source_id": source_id,
                        "external_id": card_number,
                        "identifier_type": "digimon_card_id",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                    requests.post(f"{SUPABASE_URL}/rest/v1/external_identifiers", headers=HEADERS, json=ext_payload)

    logger.info("Sync complete.")

def refresh_view():
    """Trigger materialized view refresh via RPC if possible."""
    logger.info("Refreshing materialized view...")
    # This requires a custom RPC or direct SQL. Through PostgREST it might not be possible 
    # unless we have an RPC defined.
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/refresh_all_materialized_views"
    res = requests.post(rpc_url, headers=HEADERS)
    if res.status_code == 200:
        logger.info("View refresh triggered successfully.")
    else:
        logger.warning(f"Could not refresh view via RPC: {res.text}")

if __name__ == "__main__":
    cards = fetch_digimon_cards()
    if cards:
        sync_digimon_data(cards)
        refresh_view()
