import sys
import os
import requests
import time
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Add common directory to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent))

from common.db import get_db_connection, setup_logging

# Initialize
logger = setup_logging("POKEMON")

API_BASE_URL = "https://api.pokemontcg.io/v2"
GAME_ID = 23 

# Configuration
api_key = os.getenv("POKEMON_TCG_API_KEY")
HEADERS = {}
if api_key:
    HEADERS["X-Api-Key"] = api_key

def fetch_all_sets() -> List[Dict[str, Any]]:
    """Fetch all sets from the Pokémon TCG API."""
    logger.info("Fetching all sets from Pokémon TCG API...")
    url = f"{API_BASE_URL}/sets"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    data = response.json()
    return data.get("data", [])

def sync_sets(sets_data: List[Dict[str, Any]]):
    """Sync sets into the DB via psycopg2."""
    logger.info(f"Syncing {len(sets_data)} sets...")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            for set_data in sets_data:
                set_code = set_data.get("id")
                set_name = set_data.get("name")
                release_date_str = set_data.get("releaseDate", "")
                
                release_date = None
                if release_date_str:
                    try:
                        release_date = release_date_str.replace("/", "-")
                    except:
                        pass
                
                cur.execute("SELECT set_id FROM sets WHERE game_id = %s AND set_code = %s", (GAME_ID, set_code))
                existing = cur.fetchone()
                
                if existing:
                    cur.execute("""
                        UPDATE sets 
                        SET set_name = %s, release_date = %s, total_cards = %s, printed_total = %s, updated_at = %s
                        WHERE set_id = %s
                    """, (set_name, release_date, set_data.get("total"), set_data.get("printedTotal"), datetime.now(timezone.utc), existing[0]))
                else:
                    cur.execute("""
                        INSERT INTO sets (game_id, set_code, set_name, release_date, total_cards, printed_total, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (GAME_ID, set_code, set_name, release_date, set_data.get("total"), set_data.get("printedTotal"), datetime.now(timezone.utc)))
            conn.commit()
    finally:
        conn.close()

def fetch_cards_for_set(set_id: str) -> List[Dict[str, Any]]:
    """Fetch all cards for a specific set from the Pokémon TCG API."""
    logger.info(f"Fetching cards for set {set_id}...")
    cards = []
    page = 1
    pageSize = 250
    
    while True:
        url = f"{API_BASE_URL}/cards?q=set.id:{set_id}&page={page}&pageSize={pageSize}"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        
        page_cards = data.get("data", [])
        cards.extend(page_cards)
        
        logger.info(f"Fetched page {page} for set {set_id} ({len(page_cards)} cards)")
        
        if len(page_cards) < pageSize:
            break
            
        page += 1
        if not api_key:
            time.sleep(1) 
            
    return cards

def get_or_create_card(cur, card_name: str, tcg_attributes: Dict[str, Any]) -> str:
    """Find or create a base card record."""
    cur.execute("SELECT card_id FROM cards WHERE game_id = %s AND card_name = %s LIMIT 1", (GAME_ID, card_name))
    existing = cur.fetchone()
    
    if existing:
        card_id = existing[0]
        cur.execute("""
            UPDATE cards 
            SET tcg_specific_attributes = %s, updated_at = %s
            WHERE card_id = %s
        """, (json.dumps(tcg_attributes), datetime.now(timezone.utc), card_id))
        return card_id
    else:
        cur.execute("""
            INSERT INTO cards (game_id, card_name, tcg_specific_attributes, updated_at)
            VALUES (%s, %s, %s, %s)
            RETURNING card_id
        """, (GAME_ID, card_name, json.dumps(tcg_attributes), datetime.now(timezone.utc)))
        return cur.fetchone()[0]

def sync_cards_for_set(set_id_code: str):
    """Sync all cards for a specific set via psycopg2."""
    logger.info(f"--- Starting Sync for Set: {set_id_code} ---")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT set_id, set_code FROM sets WHERE game_id = %s AND set_code = %s", (GAME_ID, set_id_code))
            set_data = cur.fetchone()
            if not set_data:
                logger.error(f"Set {set_id_code} not found in DB.")
                return
            set_uuid, set_code = set_data
            
            cur.execute("SELECT source_id FROM sources WHERE source_code = 'POKEMON_API'")
            source_res = cur.fetchone()
            if not source_res:
                cur.execute("INSERT INTO sources (source_name, source_code) VALUES ('Pokémon TCG API', 'POKEMON_API') RETURNING source_id")
                source_id = cur.fetchone()[0]
            else:
                source_id = source_res[0]
            
            api_cards = fetch_cards_for_set(set_id_code)
            logger.info(f"Processing {len(api_cards)} cards for set {set_id_code}...")
            
            for api_card in api_cards:
                try:
                    tcg_attributes = {
                        "hp": api_card.get("hp"),
                        "evolvesFrom": api_card.get("evolvesFrom"),
                        "abilities": api_card.get("abilities"),
                        "attacks": api_card.get("attacks"),
                        "weaknesses": api_card.get("weaknesses"),
                        "retreatCost": api_card.get("retreatCost"),
                        "types": api_card.get("types"),
                        "supertype": api_card.get("supertype"),
                        "subtypes": api_card.get("subtypes")
                    }
                    card_uuid = get_or_create_card(cur, api_card.get("name"), tcg_attributes)
                    
                    finishes = api_card.get("finishes", ["normal"])
                    for finish in finishes:
                        is_foil = finish.lower() in ["holofoil", "reverseholofoil"]
                        collector_number = api_card.get("number")
                        
                        cur.execute("""
                            SELECT printing_id FROM card_printings 
                            WHERE card_id = %s AND set_id = %s AND collector_number = %s AND is_foil = %s
                        """, (card_uuid, set_uuid, collector_number, is_foil))
                        existing_print = cur.fetchone()
                        
                        printing_payload = {
                            "rarity": api_card.get("rarity"),
                            "artist": api_card.get("artist"),
                            "image_url": api_card.get("images", {}).get("small"),
                            "tcg_specific_printing_attributes": json.dumps({
                                "finish": finish,
                                "flavorText": api_card.get("flavorText"),
                                "rules": api_card.get("rules"),
                                "pokemon_tcg_id": api_card.get("id")
                            }),
                            "updated_at": datetime.now(timezone.utc)
                        }
                        
                        printing_id = None
                        if existing_print:
                            printing_id = existing_print[0]
                            cur.execute("""
                                UPDATE card_printings 
                                SET rarity = %s, artist = %s, image_url = %s, tcg_specific_printing_attributes = %s, updated_at = %s
                                WHERE printing_id = %s
                            """, (printing_payload["rarity"], printing_payload["artist"], printing_payload["image_url"], 
                                  printing_payload["tcg_specific_printing_attributes"], printing_payload["updated_at"], printing_id))
                        else:
                            cur.execute("""
                                INSERT INTO card_printings 
                                (card_id, set_id, set_code, collector_number, rarity, artist, is_foil, is_non_foil, image_url, tcg_specific_printing_attributes, updated_at)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                RETURNING printing_id
                            """, (card_uuid, set_uuid, set_code, collector_number, printing_payload["rarity"], 
                                  printing_payload["artist"], is_foil, not is_foil, printing_payload["image_url"], 
                                  printing_payload["tcg_specific_printing_attributes"], printing_payload["updated_at"]))
                            printing_id = cur.fetchone()[0]
                        
                        # 6. External Identifier (Manual UPSERT)
                        cur.execute("""
                            SELECT identifier_id FROM external_identifiers 
                            WHERE printing_id = %s AND source_id = %s
                        """, (printing_id, source_id))
                        existing_ext = cur.fetchone()
                        
                        if existing_ext:
                            cur.execute("""
                                UPDATE external_identifiers 
                                SET external_id = %s, updated_at = %s
                                WHERE identifier_id = %s
                            """, (api_card.get("id"), datetime.now(timezone.utc), existing_ext[0]))
                        else:
                            cur.execute("""
                                INSERT INTO external_identifiers (printing_id, source_id, external_id, identifier_type, updated_at)
                                VALUES (%s, %s, %s, %s, %s)
                            """, (printing_id, source_id, api_card.get("id"), "pokemon_tcg_id", datetime.now(timezone.utc)))
                    
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Error processing card {api_card.get('id')}: {e}")
    finally:
        conn.close()

def refresh_materialized_view():
    """Refresh the mv_unique_cards materialized view."""
    logger.info("Refreshing Materialized View public.mv_unique_cards...")
    try:
        conn = get_db_connection()
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_unique_cards")
        conn.close()
        logger.info("Materialized View refreshed successfully.")
    except Exception as e:
        logger.error(f"Failed to refresh Materialized View: {e}")

def run_sync(specific_set: Optional[str] = None):
    """Main entry point."""
    logger.info("=== STARTING POKÉMON TCG SYNC (Direct SQL) ===")
    
    try:
        if not specific_set:
            sets = fetch_all_sets()
            sync_sets(sets)
            logger.info("Sets synced. Specify a set_id to sync cards (e.g. 'base1').")
        else:
            sync_cards_for_set(specific_set)
            refresh_materialized_view()
            
    except Exception as e:
        logger.error(f"Critical error during sync: {e}")
        
    logger.info("=== POKÉMON TCG SYNC COMPLETE ===")

if __name__ == "__main__":
    target_set = sys.argv[1] if len(sys.argv) > 1 else None
    run_sync(target_set)
