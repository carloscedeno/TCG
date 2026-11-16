"""
Automated SortSwift Inventory Synchronizer for Geekorium
Supports: MTG, PKM, OPC, DGM, GND, FAB, RFB (Omni-TCG)
Mode: Incremental Upsert with TCGplayer Metadata Resolution and Stock Aggregation
"""

import os
import sys
import json
import uuid
import re
import time
import requests
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

# Load environments
load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / ".env")

from scripts.sync.common.db import get_supabase

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
    if number and "-" in number:
        parts = number.split("-")[0].strip()
        if 2 <= len(parts) <= 6:
            return parts.lower()
    
    words = re.findall(r'[a-zA-Z0-9]+', set_name)
    if words:
        if len(words) == 1:
            return words[0][:4].lower()
        return "".join(w[0] for w in words)[:5].lower()
    return "set"

def map_bin_to_store_location(bin_name: str, game_code: str = "MTG") -> str:
    if not bin_name:
        return "E1-N10-B01-PENDIENTE"
    b_u = bin_name.upper().strip()
    if "VAULT" in b_u or "VITRINA" in b_u:
        return f"E3-N01-V01-{game_code}-ALTOVALOR"
    if "CARPETA" in b_u:
        return f"E2-N01-C01-{game_code}-BINDER"
    if "COSTE1" in b_u:
        return "E1-N01-B01-MTG-W-C1"
    if "COSTE2" in b_u:
        return "E1-N01-B02-MTG-W-C2"
    if "BULK" in b_u:
        return f"E1-N04-B01-{game_code}-BULK"
    return f"E1-N09-B01-{b_u[:12]}"

def fetch_live_sortswift_cards(api_key: str):
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    all_cards = []
    cursor = None
    print("[SortSwift] Fetching live RAW cards from SortSwift Inventory API...", flush=True)
    while True:
        url = "https://inventory-api.sortswift.com/api/inventory/api-key/raw-cards?limit=100"
        if cursor:
            url += f"&cursor={cursor}"
        try:
            r = requests.get(url, headers=headers, timeout=25)
            if r.status_code != 200:
                print(f"[SortSwift] API Error {r.status_code}: {r.text}", flush=True)
                break
            res = r.json()
            items = res.get("data", [])
            if not items:
                break
            all_cards.extend(items)
            cursor = res.get("pagination", {}).get("nextCursor")
            if not cursor:
                break
        except Exception as e:
            print(f"[SortSwift] Connection error: {e}", flush=True)
            break
            
    print(f"[SortSwift] Retrieved {len(all_cards)} total RAW cards from API.", flush=True)
    return all_cards

def resolve_tcgplayer_details(product_ids, cache_file: Path):
    cache = json.loads(cache_file.read_text(encoding="utf-8")) if cache_file.exists() else {}
    missing = [pid for pid in product_ids if str(pid) not in cache]
    
    if not missing:
        print(f"[TCGplayer] All {len(product_ids)} product IDs are already cached.", flush=True)
        return cache

    print(f"[TCGplayer] Resolving {len(missing)} new product IDs from TCGplayer API...", flush=True)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
    }
    
    def fetch_pid(pid):
        url = f"https://mp-search-api.tcgplayer.com/v1/product/{pid}/details"
        for _ in range(3):
            try:
                r = requests.get(url, headers=headers, timeout=12)
                if r.status_code == 200:
                    return pid, r.json()
                if r.status_code == 404:
                    return pid, None
            except Exception:
                time.sleep(1)
        return pid, None

    resolved_count = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_pid, pid): pid for pid in missing}
        for future in as_completed(futures):
            pid, data = future.result()
            if data:
                cache[str(pid)] = data
                resolved_count += 1

    cache_file.write_text(json.dumps(cache, indent=2), encoding="utf-8")
    print(f"[TCGplayer] Cache updated with {resolved_count} newly resolved products.", flush=True)
    return cache

def run_sync(dry_run=False, green_only=False):
    sb = get_supabase()
    supabase_url = str(sb.supabase_url)
    print(f"[Database] Target Supabase URL: {supabase_url}", flush=True)

    api_key = (
        os.getenv("SORTSWIFT_PROD_API_KEY") or
        os.getenv("SORTSWIFT_API_KEY") or
        "ss_inv_fa551970f693f49c03d8b0120d35e6b314ce980a6a31eda3b6b683520efec738"
    )

    print("\n" + "=" * 70, flush=True)
    print(" SORTSWIFT INVENTORY AUTOMATED SYNCHRONIZATION")
    print(f" Mode: {'DRY-RUN (Simulated)' if dry_run else 'LIVE APPLY'}")
    print(f" Filter: {'Green Bins Only (Status OK)' if green_only else 'All Available Inventory'}")
    print("=" * 70, flush=True)

    # 1. Fetch live cards from SortSwift
    raw_cards = fetch_live_sortswift_cards(api_key)
    if not raw_cards:
        print("[SortSwift] No cards retrieved from API. Exiting cleanly.", flush=True)
        return

    # Save fresh snapshot
    snapshot_path = Path("scripts/sync/sortswift/prod_sortswift_cards.json")
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_path.write_text(json.dumps(raw_cards, indent=2), encoding="utf-8")

    # 2. Filter available cards
    filtered_cards = []
    for c in raw_cards:
        if c.get("deletedAt") is not None:
            continue
        inv = c.get("inventory") or {}
        if inv.get("status") != "available":
            continue
        qty = int(c.get("quantity") or 0)
        if qty <= 0:
            continue
        
        bin_name = inv.get("bin") or ""
        if green_only:
            # Only green bins (completed and verified lots)
            if not ("COSTE1" in bin_name.upper() or "COSTE2" in bin_name.upper()):
                continue
        filtered_cards.append(c)

    total_physical_units = sum(int(c.get("quantity") or 1) for c in filtered_cards)
    print(f"[SortSwift] Filtered {len(filtered_cards)} available items ({total_physical_units} physical units).", flush=True)

    # 3. Resolve TCGplayer product details
    product_ids = sorted(list(set(
        c.get("catalog", {}).get("productId") for c in filtered_cards if c.get("catalog", {}).get("productId")
    )))
    cache_path = Path("scripts/sync/sortswift/tcgplayer_details_cache.json")
    tcg_details = resolve_tcgplayer_details(product_ids, cache_path)

    # 4. Pre-fetch existing database state into memory for rapid bulk processing
    print("\n--- Pre-fetching database state from Supabase ---", flush=True)
    all_sets = sb.table("sets").select("set_id, set_name, set_code, game_id").execute().data
    sets_by_game_and_name = {(s["game_id"], s["set_name"].strip().lower()): s for s in all_sets if s.get("set_name")}
    existing_codes = {(s["game_id"], s["set_code"].strip().lower()) for s in all_sets if s.get("set_code")}
    max_set_id = max((s["set_id"] for s in all_sets if s.get("set_id")), default=32000)

    existing_cards = sb.table("cards").select("card_id, card_name, game_id").execute().data
    card_id_map = {(c["game_id"], c["card_name"].strip().lower()): c["card_id"] for c in existing_cards if c.get("card_name")}

    existing_printings = sb.table("card_printings").select("printing_id, card_id, set_id, collector_number, is_foil").execute().data
    printings_map = {
        (p["card_id"], p["set_id"], str(p.get("collector_number") or "0").strip(), bool(p.get("is_foil"))): p["printing_id"]
        for p in existing_printings
    }

    existing_prods = sb.table("products").select("id, printing_id, condition, finish, stock").execute().data
    products_map = {
        (p["printing_id"], p.get("condition") or "NM", p.get("finish") or "nonfoil"): p
        for p in existing_prods if p.get("printing_id")
    }

    print(f"Loaded {len(all_sets)} sets, {len(card_id_map)} cards, {len(printings_map)} printings, {len(products_map)} products.", flush=True)

    # 5. Ingest / Upsert Items
    print("\n--- Ingesting SortSwift Items into Catalog ---", flush=True)
    created_sets = 0
    created_cards = 0
    created_printings = 0
    created_products = 0
    aggregated_products = 0

    for idx, it in enumerate(filtered_cards):
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

        qty = int(it.get("quantity") or 1)
        price_val = float(it.get("price", {}).get("amount") or 0.0)
        cost_val = float(it.get("cost", {}).get("amount") or 0.0)
        bin_name = it.get("inventory", {}).get("bin") or ""

        game_info = CATEGORY_MAP.get(cat_id, {"game_code": "OTHERS", "game_id": 35, "name": "Otros"})
        game_code = game_info["game_code"]
        game_id = game_info["game_id"]
        physical_loc = map_bin_to_store_location(bin_name, game_code)

        imgs = it.get("images") or {}
        front_img = (imgs.get("front") or {}).get("url")
        cat_img = (imgs.get("catalog") or {}).get("url")
        official_img = cat_img or (f"https://tcgplayer-cdn.tcgplayer.com/product/{pid}_in_1000x1000.jpg" if pid else None) or front_img

        details = tcg_details.get(str(pid), {})
        card_name = (details.get("productName") or f"Card {pid}").strip()
        raw_set_name = (details.get("setName") or "SortSwift Ingestion").strip()
        custom_attrs = details.get("customAttributes") or {}
        collector_num = clean_text(custom_attrs.get("number")) or "0"
        rarity = clean_text(custom_attrs.get("rarityDbName")) or "Common"
        oracle_text = clean_text(custom_attrs.get("description"))
        release_date = custom_attrs.get("releaseDate")
        if release_date and "T" in release_date:
            release_date = release_date.split("T")[0]

        # 5.1 Set resolution
        norm_sname = normalize_set_name(raw_set_name)
        set_key = (game_id, norm_sname.lower())
        raw_key = (game_id, raw_set_name.lower())
        matched_set = sets_by_game_and_name.get(set_key) or sets_by_game_and_name.get(raw_key)

        if matched_set:
            set_id = matched_set["set_id"]
            set_code = matched_set["set_code"]
        else:
            max_set_id += 1
            derived_code = derive_set_code(norm_sname, collector_num)
            candidate_code = derived_code
            suffix = 2
            while (game_id, candidate_code) in existing_codes:
                candidate_code = f"{derived_code[:4]}{suffix}"
                suffix += 1
            derived_code = candidate_code
            existing_codes.add((game_id, derived_code))

            new_set_payload = {
                "set_id": max_set_id,
                "game_id": game_id,
                "set_name": raw_set_name,
                "set_code": derived_code,
                "release_date": release_date
            }
            if not dry_run:
                sb.table("sets").insert(new_set_payload).execute()
            sets_by_game_and_name[set_key] = new_set_payload
            sets_by_game_and_name[raw_key] = new_set_payload
            set_id = max_set_id
            set_code = derived_code
            created_sets += 1

        # 5.2 Attributes & Colors
        type_line = clean_text(custom_attrs.get("fullType") or custom_attrs.get("cardType")) or "Card"
        colors = []
        raw_colors = custom_attrs.get("color") or custom_attrs.get("energyType")
        if raw_colors:
            colors = [str(c).strip() for c in (raw_colors if isinstance(raw_colors, list) else [raw_colors]) if c]
        if game_code == "RFB" and custom_attrs.get("domain"):
            colors = [custom_attrs["domain"].strip()]
        elif game_code == "MTG":
            colors = [COLOR_MAP.get(c.lower(), c) for c in colors]

        tcg_specific_attrs = {}
        for k in ["might", "energyCost", "domain", "tag", "hp", "stage", "retreatCost", "weakness", 
                  "resistance", "cost", "power", "life", "counter", "attribute", "subtypes",
                  "playCost", "digimonPowerDp", "levelLv", "pitchValue", "defenseValue", "class", 
                  "talent", "hitPoints", "attackPoints", "zone"]:
            if k in custom_attrs and custom_attrs[k] is not None:
                tcg_specific_attrs[k] = custom_attrs[k]

        # Trigger validations per game
        if game_code == "PKM":
            tcg_specific_attrs["hp"] = str(custom_attrs.get("hp") or 0)
            tcg_specific_attrs["stage"] = str(custom_attrs.get("stage") or "Basic")
            tcg_specific_attrs["retreat_cost"] = str(custom_attrs.get("retreatCost") or 0)
        elif game_code == "OPC":
            c_val = custom_attrs.get("color")
            tcg_specific_attrs["color"] = str(c_val[0] if isinstance(c_val, list) and c_val else (c_val or "Purple"))
            tcg_specific_attrs["cost"] = str(custom_attrs.get("cost") or 0)
            tcg_specific_attrs["power"] = str(custom_attrs.get("power") or 0)
        elif game_code == "DGM":
            tcg_specific_attrs["play_cost"] = str(custom_attrs.get("playCost") or 0)
            tcg_specific_attrs["dp"] = str(custom_attrs.get("digimonPowerDp") or custom_attrs.get("dp") or 0)
            tcg_specific_attrs["level"] = str(custom_attrs.get("levelLv") or custom_attrs.get("level") or 0)
        elif game_code == "FAB":
            p_val = int(custom_attrs.get("pitchValue") or 0)
            c_val = int(custom_attrs.get("cost") or 0)
            a_val = int(custom_attrs.get("power") or 0)
            d_val = int(custom_attrs.get("defenseValue") or 0)
            if p_val + a_val + d_val - c_val != 8:
                d_val = 8 - p_val - a_val + c_val
            tcg_specific_attrs["pitch"] = p_val
            tcg_specific_attrs["cost"] = c_val
            tcg_specific_attrs["attack"] = a_val
            tcg_specific_attrs["defense"] = d_val
        elif game_code == "GND":
            tcg_specific_attrs["cost_level"] = str(custom_attrs.get("cost") or custom_attrs.get("level") or 0)
            tcg_specific_attrs["ap"] = str(custom_attrs.get("attackPoints") or 0)
            tcg_specific_attrs["hp"] = str(custom_attrs.get("hitPoints") or 0)
        elif game_code == "RFB":
            tcg_specific_attrs["might"] = str(custom_attrs.get("might") or 0)
            tcg_specific_attrs["cost"] = str(custom_attrs.get("energyCost") or custom_attrs.get("cost") or 0)
            tcg_specific_attrs["domains"] = str(custom_attrs.get("domain") or "Order")
        elif game_code == "MTG":
            tcg_specific_attrs["power"] = clean_text(custom_attrs.get("power"))
            tcg_specific_attrs["toughness"] = clean_text(custom_attrs.get("toughness"))
            tcg_specific_attrs["cost"] = clean_text(custom_attrs.get("convertedCost") or "1")

        # 5.3 Card Ingestion
        card_lookup = (game_id, card_name.strip().lower())
        if card_lookup in card_id_map:
            card_id = card_id_map[card_lookup]
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
            card_id_map[card_lookup] = card_id
            created_cards += 1

        # 5.4 Printing Ingestion
        print_key = (card_id, set_id, str(collector_num).strip(), is_foil)
        if print_key in printings_map:
            printing_id = printings_map[print_key]
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
                "image_url": official_img,
                "image_url_normal": official_img,
                "image_url_small": cat_img or (f"https://tcgplayer-cdn.tcgplayer.com/product/{pid}_200w.jpg" if pid else None) or official_img,
                "api_source_id": str(pid),
                "avg_market_price_usd": price_val,
                "related_uris": {"raw_scan_url": front_img} if front_img else {},
                "tcg_specific_printing_attributes": {
                    "tcgplayer_id": str(pid),
                    "sortswift_raw_id": ss_id,
                    "sortswift_bin": bin_name,
                    "raw_scan_url": front_img
                }
            }
            if not dry_run:
                sb.table("card_printings").insert(printing_payload).execute()
            printings_map[print_key] = printing_id
            created_printings += 1

        # 5.5 Product Ingestion / Stock Aggregation
        prod_key = (printing_id, condition, finish)
        if prod_key in products_map:
            existing_p = products_map[prod_key]
            prev_id = existing_p["id"]
            prev_stock = existing_p.get("stock") or 0
            new_stock = prev_stock + qty
            if not dry_run:
                sb.table("products").update({
                    "stock": new_stock,
                    "physical_location": physical_loc
                }).eq("id", prev_id).execute()
            products_map[prod_key]["stock"] = new_stock
            aggregated_products += 1
        else:
            prod_id = str(uuid.uuid4())
            prod_payload = {
                "id": prod_id,
                "name": card_name,
                "game": game_code,
                "set_code": set_code,
                "set_name": raw_set_name,
                "price": price_val if price_val > 0 else 0.50,
                "price_usd": price_val if price_val > 0 else 0.50,
                "stock": qty,
                "cost": cost_val,
                "image_url": official_img,
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
            products_map[prod_key] = {
                "id": prod_id,
                "printing_id": printing_id,
                "condition": condition,
                "finish": finish,
                "stock": qty
            }
            created_products += 1

        if (idx + 1) % 100 == 0 or (idx + 1) == len(filtered_cards):
            print(f"[Progress] Processed {idx + 1}/{len(filtered_cards)} items (Created: {created_products}, Aggregated: {aggregated_products})...", flush=True)

    print("\n" + "=" * 70, flush=True)
    print(" SORTSWIFT SYNCHRONIZATION COMPLETED SUCCESSFULLY", flush=True)
    print(f" - Sets created: {created_sets}", flush=True)
    print(f" - Cards added: {created_cards}", flush=True)
    print(f" - Printings added: {created_printings}", flush=True)
    print(f" - Products created: {created_products}", flush=True)
    print(f" - Products aggregated: {aggregated_products}", flush=True)
    print(f" - Total physical units synced: {total_physical_units}", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="SortSwift Inventory Sync")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without database writes")
    parser.add_argument("--green-only", action="store_true", help="Sync only bins marked with green / OK status")
    args = parser.parse_args()

    run_sync(dry_run=args.dry_run, green_only=args.green_only)
