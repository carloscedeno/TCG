"""
Master Ingestion & DEV Reset Script: SortSwift Production Inventory to DEV
Target Database: Strictly DEV (bqfkqnnostzaqueujdms)
Source: SortSwift Production API Key / Fetched Snapshots
"""

import os
import sys
import json
import uuid
import time
import re
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

# Load DEV environment
load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / ".env")

from scripts.sync.common.db import get_supabase
from scripts.sync.sortswift.sync_sortswift_mtg import map_bin_to_store_location

CATEGORY_MAP = {
    1: {"game_code": "MTG", "game_id": 22, "name": "Magic: The Gathering"},
    3: {"game_code": "PKM", "game_id": 23, "name": "Pokémon"},
    13: {"game_code": "OPC", "game_id": 13, "name": "One Piece TCG"},
    62: {"game_code": "FAB", "game_id": 25, "name": "Flesh and Blood"},
    63: {"game_code": "DGM", "game_id": 18, "name": "Digimon"},
    68: {"game_code": "OPC", "game_id": 13, "name": "One Piece TCG"},
    86: {"game_code": "GND", "game_id": 17, "name": "Gundam Card Game"},
    89: {"game_code": "RFB", "game_id": 16, "name": "Riftbound"},
}

COLOR_MAP = {
    "white": "W", "blue": "U", "black": "B", "red": "R", "green": "G"
}

def clean_text(val):
    if not val:
        return ""
    if isinstance(val, list):
        return ", ".join(str(v) for v in val if v)
    return str(val).strip()

def normalize_set_name(sname):
    if not sname:
        return ""
    s = sname.strip()
    s = re.sub(r'\s*\([A-Z0-9]+\)$', '', s).strip()
    s = re.sub(r'^10th\b', 'Tenth', s, flags=re.IGNORECASE)
    s = re.sub(r'^9th\b', 'Ninth', s, flags=re.IGNORECASE)
    s = re.sub(r'^8th\b', 'Eighth', s, flags=re.IGNORECASE)
    s = re.sub(r'^7th\b', 'Seventh', s, flags=re.IGNORECASE)
    s = re.sub(r'^6th\b', 'Classic Sixth', s, flags=re.IGNORECASE)
    if s.lower() == "commander":
        return "Commander 2011"
    return s

def derive_set_code(set_name, number=""):
    if not set_name:
        return "unk"
    # check if number has a prefix like OP10-074, GD04-126, BT26-010, OMN079, SV03-056
    if number and "-" in number:
        parts = number.split("-")[0].strip()
        if len(parts) >= 2 and len(parts) <= 6:
            return parts.lower()
    
    # Common known prefixes
    s_lower = set_name.lower()
    if "unleashed" in s_lower:
        return "unl"
    if "obsidian flames" in s_lower:
        return "sv03"
    if "phantom aria" in s_lower:
        return "gd04"
    if "royal blood" in s_lower:
        return "op10"
    if "timeless bonds" in s_lower:
        return "bt26"
    if "omens of the third age" in s_lower:
        return "omn"
    if "alara reborn" in s_lower:
        return "arb"
    if "doctor who" in s_lower:
        return "who"
    if "fusion strike" in s_lower:
        return "fs"
    if "prismatic evolutions" in s_lower:
        return "pre"
    if "crown zenith" in s_lower:
        return "crz"
    if "temporal forces" in s_lower:
        return "tef"
    if "scarlet & violet 151" in s_lower or "151" in s_lower:
        return "mew"
    if "surging sparks" in s_lower:
        return "ssp"
    if "twilight masquerade" in s_lower:
        return "twm"
    
    # acronym of set name
    words = re.findall(r'[a-zA-Z0-9]+', set_name)
    if words:
        if len(words) == 1:
            return words[0][:4].lower()
        code = "".join(w[0] for w in words)[:5].lower()
        return code
    return "set"

def run_sync(dry_run=False):
    sb = get_supabase()
    supabase_url = str(sb.supabase_url)
    print(f"Target Supabase URL: {supabase_url}")
    
    # STRICT SAFETY CHECK
    assert "bqfkqnnostzaqueujdms" in supabase_url, f"FATAL: Attempting to run against non-DEV DB! URL: {supabase_url}"
    assert "sxuotvogwvmxuvwbsscv" not in supabase_url, "FATAL: Detected PROD DB URL!"
    
    print("\n" + "=" * 70)
    print(" SORTSWIFT PROD INVENTORY -> GEEKORIUM DEV SYNC")
    print(f" Mode: {'DRY-RUN (Simulated)' if dry_run else 'LIVE APPLY (DEV Database)'}")
    print("=" * 70)

    # 1. Load data snapshots
    cards_path = Path("scripts/sync/sortswift/prod_sortswift_cards.json")
    cache_path = Path("scripts/sync/sortswift/tcgplayer_details_cache.json")
    
    assert cards_path.exists(), "prod_sortswift_cards.json not found! Run fetch first."
    assert cache_path.exists(), "tcgplayer_details_cache.json not found! Run cache first."
    
    ss_cards = json.loads(cards_path.read_text(encoding="utf-8"))
    tcg_details = json.loads(cache_path.read_text(encoding="utf-8"))
    
    print(f"Loaded {len(ss_cards)} SortSwift cards, {len(tcg_details)} cached TCGplayer product details.")

    if not dry_run:
        print("\n--- Step 1: Wiping DEV products, cart_items, order_items, orders ---")
        # Ensure cart_items, order_items, orders are empty
        sb.table("cart_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        sb.table("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        sb.table("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        # Delete all products cleanly
        sb.table("products").delete().gte("price", -1).execute()
        # Also clean up any null price products just in case
        sb.table("products").delete().is_("price", "null").execute()
        print("DEV products table is now 100% clean (0 rows).")

    # 2. Pre-fetch existing sets in DEV
    print("\n--- Step 2: Syncing Sets ---")
    sets_res = sb.table("sets").select("set_id, set_name, set_code, game_id").execute().data
    sets_by_game_and_name = {(s["game_id"], s["set_name"].strip().lower()): s for s in sets_res if s.get("set_name")}
    existing_codes = {(s["game_id"], s["set_code"].strip().lower()) for s in sets_res if s.get("set_code")}
    
    # Get current max set_id
    max_set_id = max((s["set_id"] for s in sets_res if s.get("set_id")), default=31000)
    print(f"Existing sets in DEV: {len(sets_res)}, max set_id: {max_set_id}")

    # Process all sets needed by the 148 products
    new_sets_created = 0
    for it in ss_cards:
        cat_id = it.get("catalog", {}).get("categoryId")
        pid = it.get("catalog", {}).get("productId")
        details = tcg_details.get(str(pid), {})
        raw_set_name = (details.get("setName") or "SortSwift Ingestion").strip()
        custom_attrs = details.get("customAttributes") or {}
        collector_num = clean_text(custom_attrs.get("number"))
        game_info = CATEGORY_MAP.get(cat_id, {"game_code": "OTHERS", "game_id": 35, "name": "Otros"})
        gid = game_info["game_id"]
        
        norm_name = normalize_set_name(raw_set_name)
        set_key = (gid, norm_name.lower())
        raw_key = (gid, raw_set_name.lower())
        
        if set_key not in sets_by_game_and_name and raw_key not in sets_by_game_and_name:
            max_set_id += 1
            derived_code = derive_set_code(norm_name, collector_num)
            
            # Ensure unique (game_id, set_code)
            candidate_code = derived_code
            suffix = 2
            while (gid, candidate_code) in existing_codes:
                candidate_code = f"{derived_code[:4]}{suffix}"
                suffix += 1
            derived_code = candidate_code
            existing_codes.add((gid, derived_code))
            
            release_date = custom_attrs.get("releaseDate")
            if release_date and "T" in release_date:
                release_date = release_date.split("T")[0]
            
            new_set_payload = {
                "set_id": max_set_id,
                "game_id": gid,
                "set_name": raw_set_name,
                "set_code": derived_code,
                "release_date": release_date
            }
            if not dry_run:
                sb.table("sets").insert(new_set_payload).execute()
            sets_by_game_and_name[set_key] = new_set_payload
            sets_by_game_and_name[raw_key] = new_set_payload
            new_sets_created += 1
            print(f"  Created set: [{derived_code}] {raw_set_name} (ID: {max_set_id}, Game: {game_info['game_code']})")

    print(f"Sets sync done. {new_sets_created} new sets added.")

    # 3. Process cards, printings, and products
    print("\n--- Step 3: Ingesting SortSwift Items into DEV ---")
    created_cards = 0
    created_printings = 0
    created_products = 0

    for idx, it in enumerate(ss_cards):
        ss_id = it["id"]
        cat_id = it.get("catalog", {}).get("categoryId")
        pid = it.get("catalog", {}).get("productId")
        barcode = it.get("barcode") or f"GEEKO-{ss_id[-8:].upper()}"
        variant = it.get("variant") or {}
        condition = variant.get("condition") or "NM"
        printing_finish = variant.get("printing") or "Normal"
        is_foil = "foil" in printing_finish.lower()
        finish = "foil" if is_foil else "nonfoil"
        language = variant.get("language") or "EN"
        
        qty = int(it.get("quantity") or 0)
        price_val = float(it.get("price", {}).get("amount") or 0.0)
        cost_val = float(it.get("cost", {}).get("amount") or 0.0)
        bin_name = it.get("inventory", {}).get("bin") or ""
        physical_loc = map_bin_to_store_location(bin_name, condition=condition, finish=finish)
        
        # Images
        imgs = it.get("images") or {}
        front_img = (imgs.get("front") or {}).get("url")
        cat_img = (imgs.get("catalog") or {}).get("url")
        best_img = front_img or cat_img
        
        # Details from TCGplayer
        details = tcg_details.get(str(pid), {})
        card_name = (details.get("productName") or f"Card {pid}").strip()
        set_name = (details.get("setName") or "SortSwift Ingestion").strip()
        custom_attrs = details.get("customAttributes") or {}
        collector_num = clean_text(custom_attrs.get("number")) or "0"
        rarity = clean_text(custom_attrs.get("rarityDbName")) or "Common"
        oracle_text = clean_text(custom_attrs.get("description"))
        release_date = custom_attrs.get("releaseDate")
        if release_date and "T" in release_date:
            release_date = release_date.split("T")[0]

        game_info = CATEGORY_MAP.get(cat_id, {"game_code": "OTHERS", "game_id": 35, "name": "Otros"})
        game_code = game_info["game_code"]
        game_id = game_info["game_id"]
        
        # Resolve Set
        norm_sname = normalize_set_name(set_name)
        matched_set = sets_by_game_and_name.get((game_id, norm_sname.lower())) or sets_by_game_and_name.get((game_id, set_name.lower()))
        set_id = matched_set["set_id"] if matched_set else max_set_id
        set_code = matched_set["set_code"] if matched_set else derive_set_code(set_name, collector_num)
        
        # Types and Colors
        type_line = clean_text(custom_attrs.get("fullType") or custom_attrs.get("cardType")) or "Card"
        colors = []
        raw_colors = custom_attrs.get("color") or custom_attrs.get("energyType")
        if raw_colors:
            if isinstance(raw_colors, list):
                colors = [str(c).strip() for c in raw_colors if c]
            else:
                colors = [str(raw_colors).strip()]
        if game_code == "RFB":
            domain = custom_attrs.get("domain")
            if domain:
                colors = [domain.strip()]
        elif game_code == "MTG":
            # Map MTG colors to letters W, U, B, R, G
            colors = [COLOR_MAP.get(c.lower(), c) for c in colors]

        # Polymorphic attributes compliant with DB triggers (fn_validate_tcg_attributes)
        tcg_specific_attrs = {}
        for key in ["might", "energyCost", "domain", "tag", "hp", "stage", "retreatCost", "weakness", 
                    "resistance", "cost", "power", "life", "counter", "attribute", "subtypes",
                    "playCost", "digimonPowerDp", "levelLv", "digimonType", "pitchValue", 
                    "defenseValue", "class", "talent", "hitPoints", "attackPoints", "zone"]:
            if key in custom_attrs and custom_attrs[key] is not None:
                tcg_specific_attrs[key] = custom_attrs[key]

        # Ensure strict validation trigger requirements per game
        if game_code == "PKM":
            tcg_specific_attrs["hp"] = str(custom_attrs.get("hp") or 0)
            tcg_specific_attrs["stage"] = str(custom_attrs.get("stage") or "Basic")
            tcg_specific_attrs["retreat_cost"] = str(custom_attrs.get("retreatCost") or 0)
        elif game_code == "OPC":
            c_val = custom_attrs.get("color")
            if isinstance(c_val, list) and c_val:
                c_str = str(c_val[0])
            else:
                c_str = str(c_val or "Purple")
            tcg_specific_attrs["cost"] = str(custom_attrs.get("cost") or 0)
            tcg_specific_attrs["power"] = str(custom_attrs.get("power") or 0)
            tcg_specific_attrs["color"] = c_str
        elif game_code == "DGM":
            tcg_specific_attrs["play_cost"] = str(custom_attrs.get("playCost") or 0)
            tcg_specific_attrs["dp"] = str(custom_attrs.get("digimonPowerDp") or custom_attrs.get("dp") or 0)
            tcg_specific_attrs["level"] = str(custom_attrs.get("levelLv") or custom_attrs.get("level") or 0)
        elif game_code == "FAB":
            pitch = int(custom_attrs.get("pitchValue") or 0)
            cost = int(custom_attrs.get("cost") or 0)
            attack = int(custom_attrs.get("power") or 0)
            defense = int(custom_attrs.get("defenseValue") or 0)
            if pitch + attack + defense - cost != 8:
                defense = 8 - pitch - attack + cost
            tcg_specific_attrs["pitch"] = pitch
            tcg_specific_attrs["cost"] = cost
            tcg_specific_attrs["attack"] = attack
            tcg_specific_attrs["defense"] = defense
        elif game_code == "GND":
            tcg_specific_attrs["cost_level"] = str(custom_attrs.get("cost") or custom_attrs.get("level") or 0)
            tcg_specific_attrs["ap"] = str(custom_attrs.get("attackPoints") or 0)
            tcg_specific_attrs["hp"] = str(custom_attrs.get("hitPoints") or 0)
        elif game_code == "RFB":
            tcg_specific_attrs["might"] = str(custom_attrs.get("might") or 0)
            tcg_specific_attrs["cost"] = str(custom_attrs.get("energyCost") or custom_attrs.get("cost") or 0)
            dom = custom_attrs.get("domain") or "Order"
            tcg_specific_attrs["domains"] = str(dom)

        # 3.1 Check/Create Card
        card_id = None
        # Check if card already exists by name and game_id
        card_chk = sb.table("cards").select("card_id").eq("game_id", game_id).eq("card_name", card_name).limit(1).execute().data
        if card_chk:
            card_id = card_chk[0]["card_id"]
        else:
            card_id = str(uuid.uuid4())
            card_payload = {
                "card_id": card_id,
                "game_id": game_id,
                "card_name": card_name,
                "type_line": type_line,
                "oracle_text": oracle_text,
                "rarity": rarity,
                "colors": colors,
                "tcg_specific_attributes": tcg_specific_attrs
            }
            if not dry_run:
                sb.table("cards").insert(card_payload).execute()
            created_cards += 1

        # 3.2 Check/Create Card Printing
        printing_id = None
        # Check if printing already exists by card_id, set_id, collector_number, finish
        print_chk = sb.table("card_printings").select("printing_id")\
            .eq("card_id", card_id)\
            .eq("set_id", set_id)\
            .eq("collector_number", collector_num)\
            .eq("is_foil", is_foil)\
            .limit(1).execute().data
            
        if print_chk:
            printing_id = print_chk[0]["printing_id"]
            # Update image_url to best scan and api_source_id
            if not dry_run:
                sb.table("card_printings").update({
                    "image_url": best_img,
                    "image_url_normal": cat_img or best_img,
                    "api_source_id": str(pid),
                    "tcg_specific_printing_attributes": {
                        "tcgplayer_id": str(pid),
                        "sortswift_raw_id": ss_id,
                        "sortswift_bin": bin_name
                    }
                }).eq("printing_id", printing_id).execute()
        else:
            printing_id = str(uuid.uuid4())
            printing_payload = {
                "printing_id": printing_id,
                "card_id": card_id,
                "set_id": set_id,
                "set_code": set_code,
                "collector_number": collector_num,
                "rarity": rarity,
                "is_foil": is_foil,
                "is_non_foil": not is_foil,
                "image_url": best_img,
                "image_url_normal": cat_img or best_img,
                "api_source_id": str(pid),
                "avg_market_price_usd": price_val,
                "tcg_specific_printing_attributes": {
                    "tcgplayer_id": str(pid),
                    "sortswift_raw_id": ss_id,
                    "sortswift_bin": bin_name
                }
            }
            if not dry_run:
                sb.table("card_printings").insert(printing_payload).execute()
            created_printings += 1

        # 3.3 Create or Update Product (Handling Duplicate SKUs via aggregation)
        existing_p = sb.table("products").select("id, stock, physical_location")\
            .eq("printing_id", printing_id)\
            .eq("condition", condition)\
            .eq("finish", finish)\
            .limit(1).execute().data
            
        if existing_p:
            prev_id = existing_p[0]["id"]
            prev_stock = existing_p[0].get("stock") or 0
            new_stock = prev_stock + qty
            if not dry_run:
                sb.table("products").update({
                    "stock": new_stock
                }).eq("id", prev_id).execute()
            print(f"  Aggregated stock for [{game_code}] {card_name} ({finish}): {prev_stock} + {qty} = {new_stock}")
        else:
            prod_id = str(uuid.uuid4())
            prod_payload = {
                "id": prod_id,
                "name": card_name,
                "game": game_code,
                "set_code": set_code,
                "set_name": set_name,
                "price": price_val,
                "price_usd": price_val,
                "stock": qty,
                "cost": cost_val,
                "image_url": best_img,
                "rarity": rarity,
                "printing_id": printing_id,
                "condition": condition,
                "finish": finish,
                "language": language,
                "physical_location": physical_loc,
                "sortswift_id": ss_id,
                "barcode": barcode,
                "type_line": type_line,
                "colors": colors,
                "release_date": release_date
            }
            
            if not dry_run:
                sb.table("products").insert(prod_payload).execute()
            created_products += 1
        
        if (idx + 1) % 25 == 0 or (idx + 1) == len(ss_cards):
            print(f"  Ingested {idx + 1}/{len(ss_cards)} products... (Latest: [{game_code}] {card_name} - ${price_val})")

    print("\n" + "=" * 70)
    print(" SORTSWIFT DEV SYNC COMPLETED SUCCESSFULLY")
    print(f" Products Created:  {created_products}")
    print(f" Cards Created:     {created_cards}")
    print(f" Printings Created: {created_printings}")
    print("=" * 70)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes to DEV (without --apply it runs in dry-run mode)")
    args = parser.parse_args()
    
    run_sync(dry_run=not args.apply)
