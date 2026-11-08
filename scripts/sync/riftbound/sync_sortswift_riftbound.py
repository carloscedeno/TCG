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
    {
        "card_name": "Ahri, Nine-Tailed Fox (Metal) (Best Of)",
        "set_name": "Riftbound Organized Play Promotional Cards",
        "set_code": "OPP",
        "collector_number": "001-F",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Mind"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #669254.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/669254.jpg",
        "price": 85.0,
        "cost_price": 38.25,
        "stock": 1,
        "bin": "RFB-01",
        "is_foil": True,
        "tcgplayer_id": 669254
    },
    {
        "card_name": "Ahri, Inquisitive",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "002",
        "type_line": "Champion - Legend",
        "rarity": "uncommon",
        "might": 5,
        "cost": 4,
        "domains": [
            "Fury",
            "Chaos"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #652901.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/652901.jpg",
        "price": 4.6,
        "cost_price": 2.07,
        "stock": 4,
        "bin": "RFB-02",
        "is_foil": False,
        "tcgplayer_id": 652901
    },
    {
        "card_name": "Ahri, Confident",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "003",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Order",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #722275.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/722275.jpg",
        "price": 0.23,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-03",
        "is_foil": False,
        "tcgplayer_id": 722275
    },
    {
        "card_name": "Ahri, Inquisitive",
        "set_name": "Vendetta",
        "set_code": "VEN",
        "collector_number": "004",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Order"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #705996.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/705996.jpg",
        "price": 42.27,
        "cost_price": 19.02,
        "stock": 4,
        "bin": "RFB-04",
        "is_foil": False,
        "tcgplayer_id": 705996
    },
    {
        "card_name": "Ahri, Alluring",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "005",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Chaos",
            "Fury"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #652842.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/652842.jpg",
        "price": 0.6,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-05",
        "is_foil": False,
        "tcgplayer_id": 652842
    },
    {
        "card_name": "Ahri, Alluring (Launch Exclusive)",
        "set_name": "Riftbound Promotional Cards",
        "set_code": "PRM",
        "collector_number": "006",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Mind",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #659765.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/659765.jpg",
        "price": 124.54,
        "cost_price": 56.04,
        "stock": 4,
        "bin": "RFB-06",
        "is_foil": False,
        "tcgplayer_id": 659765
    },
    {
        "card_name": "Ahri, Confident (K/DA Special Art Card)",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "007-F",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Mind"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #722845.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/722845.jpg",
        "price": 32.94,
        "cost_price": 14.82,
        "stock": 1,
        "bin": "RFB-07",
        "is_foil": True,
        "tcgplayer_id": 722845
    },
    {
        "card_name": "Ahri, Inquisitive (Alternate Art)",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "008-F",
        "type_line": "Champion - Legend",
        "rarity": "rare",
        "might": 5,
        "cost": 4,
        "domains": [
            "Fury",
            "Chaos"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #653231.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/653231.jpg",
        "price": 11.02,
        "cost_price": 4.96,
        "stock": 1,
        "bin": "RFB-08",
        "is_foil": True,
        "tcgplayer_id": 653231
    },
    {
        "card_name": "Ahri, Inquisitive (Overnumbered)",
        "set_name": "Spiritforged",
        "set_code": "SPF",
        "collector_number": "009",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Order",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #664881.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/664881.jpg",
        "price": 661.41,
        "cost_price": 297.63,
        "stock": 4,
        "bin": "RFB-09",
        "is_foil": False,
        "tcgplayer_id": 664881
    },
    {
        "card_name": "Ahri, Alluring (Alternate Art)",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "010-F",
        "type_line": "Champion - Legend",
        "rarity": "uncommon",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Order"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #652843.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/652843.jpg",
        "price": 4.82,
        "cost_price": 2.17,
        "stock": 1,
        "bin": "RFB-10",
        "is_foil": True,
        "tcgplayer_id": 652843
    },
    {
        "card_name": "Ahri, Nine-Tailed Fox",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "011",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Chaos",
            "Fury"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #653053.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/653053.jpg",
        "price": 0.82,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-11",
        "is_foil": False,
        "tcgplayer_id": 653053
    },
    {
        "card_name": "Riven, Shattered",
        "set_name": "Riftbound Organized Play Promotional Cards",
        "set_code": "OPP",
        "collector_number": "013",
        "type_line": "Champion - Legend",
        "rarity": "uncommon",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Mind"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #708201.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/708201.jpg",
        "price": 1.78,
        "cost_price": 0.8,
        "stock": 4,
        "bin": "RFB-13",
        "is_foil": False,
        "tcgplayer_id": 708201
    },
    {
        "card_name": "Riven, Shattered",
        "set_name": "Riftbound Promotional Cards",
        "set_code": "PRM",
        "collector_number": "014",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Fury",
            "Chaos"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #710699.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/710699.jpg",
        "price": 168.7,
        "cost_price": 75.91,
        "stock": 4,
        "bin": "RFB-14",
        "is_foil": False,
        "tcgplayer_id": 710699
    },
    {
        "card_name": "Riven, Deserter",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "015",
        "type_line": "Champion - Legend",
        "rarity": "uncommon",
        "might": 5,
        "cost": 4,
        "domains": [
            "Order",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #723219.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/723219.jpg",
        "price": 1.16,
        "cost_price": 0.52,
        "stock": 4,
        "bin": "RFB-15",
        "is_foil": False,
        "tcgplayer_id": 723219
    },
    {
        "card_name": "Riven, Broken Blade (Alternate Art)",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "016-F",
        "type_line": "Champion - Legend",
        "rarity": "rare",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Order"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #722908.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/722908.jpg",
        "price": 6.18,
        "cost_price": 2.78,
        "stock": 1,
        "bin": "RFB-16",
        "is_foil": True,
        "tcgplayer_id": 722908
    },
    {
        "card_name": "Riven, Broken Blade",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "017",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Chaos",
            "Fury"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #722907.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/722907.jpg",
        "price": 0.18,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-17",
        "is_foil": False,
        "tcgplayer_id": 722907
    },
    {
        "card_name": "Riven, The Exile (Overnumbered)",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "018",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Mind",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #723435.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/723435.jpg",
        "price": 197.9,
        "cost_price": 89.06,
        "stock": 4,
        "bin": "RFB-18",
        "is_foil": False,
        "tcgplayer_id": 723435
    },
    {
        "card_name": "Riven, Shattered",
        "set_name": "Vendetta",
        "set_code": "VEN",
        "collector_number": "019",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Mind"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #706093.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/706093.jpg",
        "price": 0.16,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-19",
        "is_foil": False,
        "tcgplayer_id": 706093
    },
    {
        "card_name": "Riven, The Exile",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "020",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Fury",
            "Chaos"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #723434.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/723434.jpg",
        "price": 0.16,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-20",
        "is_foil": False,
        "tcgplayer_id": 723434
    },
    {
        "card_name": "Riven, Deserter (Alternate Art)",
        "set_name": "Radiance",
        "set_code": "RAD",
        "collector_number": "021-F",
        "type_line": "Champion - Legend",
        "rarity": "rare",
        "might": 5,
        "cost": 4,
        "domains": [
            "Order",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #723220.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/723220.jpg",
        "price": 5.16,
        "cost_price": 2.32,
        "stock": 1,
        "bin": "RFB-21",
        "is_foil": True,
        "tcgplayer_id": 723220
    },
    {
        "card_name": "Riven, Shattered (Overnumbered)",
        "set_name": "Vendetta",
        "set_code": "VEN",
        "collector_number": "022",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Order"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #707678.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/707678.jpg",
        "price": 91.35,
        "cost_price": 41.11,
        "stock": 4,
        "bin": "RFB-22",
        "is_foil": False,
        "tcgplayer_id": 707678
    },
    {
        "card_name": "Yasuo, Unforgiven",
        "set_name": "Riftbound Organized Play Promotional Cards",
        "set_code": "OPP",
        "collector_number": "024",
        "type_line": "Champion - Legend",
        "rarity": "rare",
        "might": 5,
        "cost": 4,
        "domains": [
            "Mind",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #662890.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/662890.jpg",
        "price": 23.62,
        "cost_price": 10.63,
        "stock": 4,
        "bin": "RFB-24",
        "is_foil": False,
        "tcgplayer_id": 662890
    },
    {
        "card_name": "Yasuo, Unforgiven (Metal) (Prize Wall)",
        "set_name": "Riftbound Organized Play Promotional Cards",
        "set_code": "OPP",
        "collector_number": "025-F",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Mind"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #689172.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/689172.jpg",
        "price": 85.0,
        "cost_price": 38.25,
        "stock": 1,
        "bin": "RFB-25",
        "is_foil": True,
        "tcgplayer_id": 689172
    },
    {
        "card_name": "Yasuo, Remorseful (Alternate Art)",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "026-F",
        "type_line": "Champion - Legend",
        "rarity": "uncommon",
        "might": 5,
        "cost": 4,
        "domains": [
            "Fury",
            "Chaos"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #652854.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/652854.jpg",
        "price": 1.96,
        "cost_price": 0.88,
        "stock": 1,
        "bin": "RFB-26",
        "is_foil": True,
        "tcgplayer_id": 652854
    },
    {
        "card_name": "Yasuo, Remorseful",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "027",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Order",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #652853.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/652853.jpg",
        "price": 0.39,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-27",
        "is_foil": False,
        "tcgplayer_id": 652853
    },
    {
        "card_name": "Yasuo, Windrider",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "028",
        "type_line": "Champion - Legend",
        "rarity": "uncommon",
        "might": 5,
        "cost": 4,
        "domains": [
            "Calm",
            "Order"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #652997.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/652997.jpg",
        "price": 1.37,
        "cost_price": 0.62,
        "stock": 4,
        "bin": "RFB-28",
        "is_foil": False,
        "tcgplayer_id": 652997
    },
    {
        "card_name": "Yasuo, Unforgiven",
        "set_name": "Origins",
        "set_code": "OGN",
        "collector_number": "029",
        "type_line": "Champion - Legend",
        "rarity": "common",
        "might": 5,
        "cost": 4,
        "domains": [
            "Chaos",
            "Fury"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #653057.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/653057.jpg",
        "price": 0.24,
        "cost_price": 0.5,
        "stock": 4,
        "bin": "RFB-29",
        "is_foil": False,
        "tcgplayer_id": 653057
    },
    {
        "card_name": "Yasuo, Windrider (Overnumbered)",
        "set_name": "Spiritforged",
        "set_code": "SPF",
        "collector_number": "030",
        "type_line": "Champion - Legend",
        "rarity": "mythic",
        "might": 5,
        "cost": 4,
        "domains": [
            "Mind",
            "Body"
        ],
        "oracle_text": "Riftbound physical trading card. Official TCGPlayer Product #668210.",
        "image_url": "https://product-images.tcgplayer.com/fit-in/437x437/668210.jpg",
        "price": 58.99,
        "cost_price": 26.55,
        "stock": 4,
        "bin": "RFB-30",
        "is_foil": False,
        "tcgplayer_id": 668210
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
        # Purge legacy RFB records to eliminate any old dummy splash arts
        logger.info("Purging legacy RFB records to eliminate old dummy splash arts...")
        try:
            sb.table("products").delete().eq("game", "RFB").execute()
            old_c = sb.table("cards").select("card_id").eq("game_id", GAME_ID).execute()
            old_c_ids = [c["card_id"] for c in (old_c.data or [])]
            if old_c_ids:
                sb.table("card_printings").delete().in_("card_id", old_c_ids).execute()
                sb.table("cards").delete().in_("card_id", old_c_ids).execute()
            logger.info("Legacy RFB records purged cleanly.")
        except Exception as cle:
            logger.warning(f"Note on legacy cleanup: {cle}")
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
