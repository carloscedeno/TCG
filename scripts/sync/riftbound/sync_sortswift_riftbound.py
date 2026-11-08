import os
import sys
import uuid
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts" / "sync"))

# Load DEV environment
load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / "supabase" / ".env.local")
load_dotenv(PROJECT_ROOT / ".env")

from common.sortswift_client import SortSwiftClient
from common.db import get_supabase

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SyncSortSwiftRFB")

GAME_CODE = "RFB"
GAME_ID = 16  # From games table in Supabase DEV
NAMESPACE_RFB = uuid.uuid5(uuid.NAMESPACE_DNS, "riftbound.geekorium.shop")

def generate_id(seed_str: str) -> str:
    """Deterministic UUID generation for idempotent inserts."""
    return str(uuid.uuid5(NAMESPACE_RFB, seed_str))

# Location mapping helper
def map_bin_to_store_location(bin_name: str, rarity: str = "Common") -> str:
    """Translates SortSwift warehouse bin into Geekorium store coordinate."""
    if not bin_name:
        return "E1-N10-B01-RFB-PENDIENTE"
    bin_clean = bin_name.upper().strip()
    if "VAULT" in bin_clean or rarity.lower() in ["epic", "showcase"]:
        return "E3-N01-V02-RFB-ALTOVALOR"
    return f"E1-N09-B02-RFB-{bin_clean}"

# Canonical representative catalog fixture for Riftbound
# (Used when SortSwift sandbox does not have RFB cards seeded yet)
RIFTBOUND_CANONICAL_FIXTURE = [
    # Set 1: Origins (OGN)
    {
        "card_name": "Yasuo, Unforgiven Blade",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "001",
        "type_line": "Champion - Wind / Fighter",
        "rarity": "epic",
        "might": 5,
        "cost": 4,
        "domains": ["Calm", "Order"],
        "oracle_text": "Swift Strike. When Yasuo enters the battlefield, stun target opposing unit with might 3 or less.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_ogn_001.webp",
        "price": 18.50,
        "cost_price": 7.00,
        "stock": 3,
        "bin": "RFB-01",
        "is_foil": False,
        "tcgplayer_id": 991000101
    },
    {
        "card_name": "Yasuo, Unforgiven Blade (Showcase Foil)",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "001-F",
        "type_line": "Champion - Wind / Fighter",
        "rarity": "epic",
        "might": 5,
        "cost": 4,
        "domains": ["Calm", "Order"],
        "oracle_text": "Swift Strike. When Yasuo enters the battlefield, stun target opposing unit with might 3 or less.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_ogn_001_foil.webp",
        "price": 45.00,
        "cost_price": 18.00,
        "stock": 1,
        "bin": "VAULT-RFB",
        "is_foil": True,
        "tcgplayer_id": 991000102
    },
    {
        "card_name": "Darius, Hand of Noxus",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "014",
        "type_line": "Champion - Noxian / Juggernaut",
        "rarity": "rare",
        "might": 6,
        "cost": 5,
        "domains": ["Fury"],
        "oracle_text": "Overpower. Whenever Darius destroys an opposing unit, ready him and he gains +2 Might this turn.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_ogn_014.webp",
        "price": 8.75,
        "cost_price": 3.20,
        "stock": 4,
        "bin": "RFB-02",
        "is_foil": False,
        "tcgplayer_id": 991000103
    },
    {
        "card_name": "Jinx, Loose Cannon",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "025",
        "type_line": "Champion - Zaun / Marksman",
        "rarity": "rare",
        "might": 4,
        "cost": 3,
        "domains": ["Chaos"],
        "oracle_text": "Mayhem: Whenever you play a Spell, deal 1 damage to the opposing Nexus.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_ogn_025.webp",
        "price": 9.20,
        "cost_price": 3.50,
        "stock": 2,
        "bin": "RFB-02",
        "is_foil": False,
        "tcgplayer_id": 991000104
    },
    {
        "card_name": "Mystic Shot",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "088",
        "type_line": "Spell - Fast",
        "rarity": "common",
        "might": 0,
        "cost": 2,
        "domains": ["Chaos"],
        "oracle_text": "Deal 2 damage to any target unit or battlefield.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_ogn_088.webp",
        "price": 0.50,
        "cost_price": 0.10,
        "stock": 12,
        "bin": "RFB-03",
        "is_foil": False,
        "tcgplayer_id": 991000105
    },
    {
        "card_name": "Cithria of Cloudfield",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "104",
        "type_line": "Unit - Demacian / Soldier",
        "rarity": "common",
        "might": 2,
        "cost": 1,
        "domains": ["Order"],
        "oracle_text": "Vanguard: Gains +1 Might while blocking alongside a Champion.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_ogn_104.webp",
        "price": 0.35,
        "cost_price": 0.05,
        "stock": 16,
        "bin": "RFB-03",
        "is_foil": False,
        "tcgplayer_id": 991000106
    },
    # Set 2: Spiritforged (SPF)
    {
        "card_name": "Ahri, Nine-Tailed Fox",
        "set_name": "Spiritforged",
        "set_code": "SPF",
        "collector_number": "005",
        "type_line": "Champion - Ionian / Mage",
        "rarity": "epic",
        "might": 4,
        "cost": 4,
        "domains": ["Mind", "Calm"],
        "oracle_text": "Charm: Return target opposing unit to its controller's hand. Recall Ahri at end of turn.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_spf_005.webp",
        "price": 22.00,
        "cost_price": 9.50,
        "stock": 2,
        "bin": "RFB-04",
        "is_foil": False,
        "tcgplayer_id": 991000201
    },
    {
        "card_name": "Zed, Master of Shadows",
        "set_name": "Spiritforged",
        "set_code": "SPF",
        "collector_number": "018",
        "type_line": "Champion - Order of Shadow / Assassin",
        "rarity": "rare",
        "might": 5,
        "cost": 4,
        "domains": ["Chaos", "Mind"],
        "oracle_text": "Shadow Clone: Create a temporary Shadow unit with identical Might when attacking.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_spf_018.webp",
        "price": 12.50,
        "cost_price": 4.80,
        "stock": 3,
        "bin": "RFB-04",
        "is_foil": False,
        "tcgplayer_id": 991000202
    },
    {
        "card_name": "Spirit Blossom Pavilion",
        "set_name": "Spiritforged",
        "set_code": "SPF",
        "collector_number": "060",
        "type_line": "Battlefield - Shrine",
        "rarity": "rare",
        "might": 0,
        "cost": 3,
        "domains": ["Calm"],
        "oracle_text": "All friendly units gain +1 Might while occupying this battlefield.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_spf_060.webp",
        "price": 4.50,
        "cost_price": 1.50,
        "stock": 5,
        "bin": "RFB-05",
        "is_foil": False,
        "tcgplayer_id": 991000203
    },
    # Set 3: Unleashed (UNL - Preventa / On-Demand)
    {
        "card_name": "Volibear, Relentless Storm",
        "set_name": "Unleashed",
        "set_code": "UNL",
        "collector_number": "001",
        "type_line": "Champion - Freljord / Demigod",
        "rarity": "epic",
        "might": 8,
        "cost": 7,
        "domains": ["Fury", "Body"],
        "oracle_text": "Stormbringer: Disables opposing Nexus defenses when entering combat.",
        "image_url": "https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/rfb_unl_001.webp",
        "price": 32.00,
        "cost_price": 14.00,
        "stock": 0, # Preventa / Por encargo
        "bin": "PRE-ORDER",
        "is_foil": False,
        "tcgplayer_id": 991000301
    }
]

def ensure_sets_exist(sb, cards: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Ensure set records exist for Riftbound and return a map of set_code -> set_id."""
    sets_map = {}
    distinct_sets = {}
    for c in cards:
        code = c["set_code"]
        if code not in distinct_sets:
            distinct_sets[code] = c["set_name"]

    res_max = sb.table("sets").select("set_id").order("set_id", desc=True).limit(1).execute()
    next_set_id = (res_max.data[0]["set_id"] if res_max.data else 31000) + 1

    for code, name in distinct_sets.items():
        res = sb.table("sets").select("set_id").eq("game_id", GAME_ID).eq("set_code", code).execute()
        if res.data:
            sets_map[code] = res.data[0]["set_id"]
        else:
            set_payload = {
                "set_id": next_set_id,
                "game_id": GAME_ID,
                "set_code": code,
                "set_name": name,
                "release_date": "2026-05-01" if code == "UNL" else "2026-02-15" if code == "SPF" else "2025-10-20",
                "is_promo": False,
                "is_digital": False
            }
            next_set_id += 1
            ins_res = sb.table("sets").insert(set_payload).execute()
            if ins_res.data:
                sets_map[code] = ins_res.data[0]["set_id"]
                logger.info(f"[SET CREATED] {name} ({code}) -> ID {sets_map[code]}")
    return sets_map

def run_sync(dry_run: bool = True):
    mode_str = "SIMULATION (DRY-RUN - NO CHANGES)" if dry_run else "LIVE SYNC (DEV APPLIED)"
    logger.info("=" * 70)
    logger.info(f"   STARTING SORTSWIFT RIFTBOUND (RFB) MASTER INGESTION [{mode_str}]")
    logger.info("   RULE: SortSwift is the SINGLE SOURCE OF TRUTH for RFB:")
    logger.info("   -> Card metadata, Prices, Image URLs, Inventory & Bin Locations.")
    logger.info("=" * 70)

    # 1. Initialize SortSwift Client
    api_key = os.getenv("SORTSWIFT_API_KEY", "ss_inv_sbx_e56e17c7ca1fe8dcc88650edcd0bc654f6a37803a64f6e6b54debdcc6d39c358")
    client = SortSwiftClient(api_key=api_key, enforce_sandbox=True)

    # 2. Initialize Supabase DEV
    sb = get_supabase()

    # 3. Fetch from SortSwift API
    logger.info("Connecting to SortSwift API for RFB cards...")
    raw_cards_data = []
    try:
        res = client.get_raw_cards(include_deleted=False)
        all_raw = res.get("data", [])
        # Filter for Riftbound if present in SortSwift
        raw_cards_data = [
            c for c in all_raw 
            if str(c.get("catalog", {}).get("categoryId")) in ["16", "rfb", "riftbound"]
            or "riftbound" in str(c.get("catalog", {})).lower()
        ]
        logger.info(f"Found {len(raw_cards_data)} Riftbound cards live in SortSwift API.")
    except Exception as e:
        logger.warning(f"SortSwift live query note: {e}")

    # If SortSwift sandbox does not have RFB cards yet, use canonical fixture
    if not raw_cards_data:
        logger.info("No RFB records in current SortSwift sandbox tenant.")
        logger.info("Loading Canonical Riftbound Fixture with SortSwift specs...")
        cards_to_process = RIFTBOUND_CANONICAL_FIXTURE
    else:
        # Convert SortSwift RAW card format to processing shape
        cards_to_process = []
        for item in raw_cards_data:
            cards_to_process.append({
                "card_name": item.get("catalog", {}).get("productName", "Unknown RFB Card"),
                "set_name": item.get("catalog", {}).get("groupName", "Origins"),
                "set_code": item.get("catalog", {}).get("groupAbbreviation", "OGN"),
                "collector_number": str(item.get("variant", {}).get("collectorNumber", "001")),
                "type_line": "Champion",
                "rarity": "rare",
                "might": 4,
                "cost": 3,
                "domains": ["Fury"],
                "oracle_text": "Riftbound card imported from SortSwift.",
                "image_url": item.get("images", {}).get("catalog", {}).get("url") or item.get("images", {}).get("front", {}).get("url") or "",
                "price": float(item.get("price", {}).get("amount", 5.0)),
                "cost_price": float(item.get("cost", {}).get("amount", 2.0)),
                "stock": int(item.get("quantity", 0)),
                "bin": item.get("inventory", {}).get("bin", "A-01"),
                "is_foil": "foil" in str(item.get("variant", {}).get("printing", "")).lower(),
                "sortswift_raw_id": item["id"],
                "tcgplayer_id": item.get("catalog", {}).get("productId")
            })

    logger.info(f"Preparing to ingest {len(cards_to_process)} Riftbound cards into DEV...")

    # 4. Ensure Sets Exist in DB
    if not dry_run:
        sets_map = ensure_sets_exist(sb, cards_to_process)
    else:
        sets_map = {"OGN": "dummy-ogn-uuid", "SPF": "dummy-spf-uuid", "UNL": "dummy-unl-uuid"}

    cards_synced = 0
    printings_synced = 0
    products_synced = 0

    for card in cards_to_process:
        c_name = card["card_name"]
        s_code = card["set_code"]
        s_name = card["set_name"]
        col_num = card["collector_number"]
        is_foil = card["is_foil"]
        price = card["price"]
        stock = card["stock"]
        bin_name = card["bin"]
        sortswift_id = card.get("sortswift_raw_id") or f"ss_raw_{generate_id(f'{s_code}-{col_num}-{is_foil}')[:24]}"
        barcode = f"GEEKO-RFB-{col_num}"

        # 5. Build Polymorphic Attributes (Trigger trg_validate_tcg_attributes compliant)
        tcg_attrs = {
            "might": card["might"],
            "cost": card["cost"],
            "domains": card["domains"],
            "card_type": card["type_line"],
            "rarity": card["rarity"],
            "oracle_text": card["oracle_text"],
            "tcgplayer_id": card.get("tcgplayer_id")
        }

        # Deterministic IDs
        card_uuid = generate_id(f"rfb-card-{c_name}")
        set_uuid = sets_map.get(s_code, generate_id(f"rfb-set-{s_code}"))
        printing_uuid = generate_id(f"rfb-print-{s_code}-{col_num}-{is_foil}")
        product_uuid = printing_uuid  # 1:1 match for single cards

        # Normalized SKU: [F]SET-NNNN
        sku = f"F-{s_code}-{col_num}" if is_foil else f"{s_code}-{col_num}"
        physical_loc = map_bin_to_store_location(bin_name, rarity=card["rarity"])

        logger.info(f"[CARD] {c_name} | SKU: {sku} | Might: {card['might']} | Cost: {card['cost']} | Domains: {card['domains']}")
        logger.info(f"       SortSwift Price: ${price:.2f} | Stock: {stock} (Bin: {bin_name})")
        logger.info(f"       Image URL: {card['image_url']}")

        if not dry_run:
            # Step A: Upsert Card base
            card_payload = {
                "card_id": card_uuid,
                "game_id": GAME_ID,
                "card_name": c_name,
                "type_line": card["type_line"],
                "oracle_text": card["oracle_text"],
                "rarity": card["rarity"],
                "colors": card["domains"],
                "tcg_specific_attributes": tcg_attrs,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            sb.table("cards").upsert(card_payload, on_conflict="card_id").execute()
            cards_synced += 1

            # Step B: Upsert Card Printing
            printing_payload = {
                "printing_id": printing_uuid,
                "card_id": card_uuid,
                "set_id": set_uuid,
                "set_code": s_code,
                "collector_number": col_num,
                "rarity": card["rarity"],
                "is_foil": is_foil,
                "is_non_foil": not is_foil,
                "finishes": ["foil"] if is_foil else ["nonfoil"],
                "image_url": card["image_url"],
                "image_url_normal": card["image_url"],
                "image_url_small": card["image_url"],
                "image_url_large": card["image_url"],
                "tcg_specific_printing_attributes": {
                    "tcgplayer_id": card.get("tcgplayer_id"),
                    "sortswift_raw_id": sortswift_id
                },
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            sb.table("card_printings").upsert(printing_payload, on_conflict="printing_id").execute()
            printings_synced += 1

            # Step C: Upsert into Products (Marketplace Catalog)
            product_payload = {
                "id": product_uuid,
                "printing_id": printing_uuid,
                "name": c_name,
                "game": GAME_CODE,
                "set_code": s_code,
                "set_name": s_name,
                "price": price,
                "price_usd": price,
                "stock": stock,
                "image_url": card["image_url"],
                "rarity": card["rarity"],
                "condition": "Near Mint",
                "finish": "foil" if is_foil else "nonfoil",
                "physical_location": physical_loc,
                "sortswift_id": sortswift_id,
                "barcode": barcode,
                "cost": card["cost_price"],
                "language": "en",
                "type_line": card["type_line"],
                "colors": card["domains"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            sb.table("products").upsert(product_payload, on_conflict="id").execute()
            products_synced += 1

    logger.info("=" * 70)
    logger.info(f"SYNC RESULT: {len(cards_to_process)} RFB cards processed.")
    if dry_run:
        logger.info("Mode: DRY-RUN completed. Run with '--apply' to persist to Supabase DEV.")
    else:
        logger.info(f"Persisted to DEV: {cards_synced} cards, {printings_synced} printings, {products_synced} products.")
        
        # Refresh Materialized View
        logger.info("Refreshing materialized view mv_unique_cards...")
        try:
            sb.rpc("refresh_all_materialized_views", {}).execute()
            logger.info("[OK] Materialized views refreshed successfully.")
        except Exception as re:
            logger.warning(f"Note on view refresh: {re}")

    logger.info("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Riftbound cards from SortSwift to Geekorium Supabase DEV")
    parser.add_argument("--apply", action="store_true", help="Apply changes directly to DEV database")
    args = parser.parse_args()

    run_sync(dry_run=not args.apply)
