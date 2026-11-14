"""
High-Speed Ingestion Script: SortSwift Green Bins -> DEV
Target Database: Strictly DEV (bqfkqnnostzaqueujdms)
Source: SortSwift Production Snapshot (Green Bins: 1,825 physical units)
"""

import os
import sys
import json
import uuid
import re
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / ".env")

from scripts.sync.common.db import get_supabase

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

def map_green_bin_location(bin_name: str) -> str:
    bin_u = bin_name.upper()
    if "COSTE1" in bin_u:
        return "E1-N01-B01-MTG-W-C1"
    elif "COSTE2" in bin_u:
        return "E1-N01-B02-MTG-W-C2"
    return "E1-N01-B01-MTG-W"

def run_sync(dry_run=False):
    sb = get_supabase()
    supabase_url = str(sb.supabase_url)
    print(f"Target Supabase URL: {supabase_url}", flush=True)
    
    # STRICT SAFETY CHECK
    assert "bqfkqnnostzaqueujdms" in supabase_url, f"FATAL: Non-DEV DB! URL: {supabase_url}"
    assert "sxuotvogwvmxuvwbsscv" not in supabase_url, "FATAL: PROD DB detected!"
    
    print("\n" + "=" * 70, flush=True)
    print(" SORTSWIFT GREEN BINS (MTG CRIATURAS BLANCAS) -> GEEKORIUM DEV", flush=True)
    print(f" Mode: {'DRY-RUN (Simulated)' if dry_run else 'LIVE APPLY (DEV Database)'}", flush=True)
    print("=" * 70, flush=True)

    # 1. Load data snapshots
    cards_path = Path("scripts/sync/sortswift/prod_sortswift_cards.json")
    cache_path = Path("scripts/sync/sortswift/tcgplayer_details_cache.json")
    
    all_cards = json.loads(cards_path.read_text(encoding="utf-8"))
    tcg_details = json.loads(cache_path.read_text(encoding="utf-8"))
    
    green_bins = {
        "E1_N1_MTG_CriaturasBlancas_Coste1_Bulk_20261111",
        "E1_N1_MTG_CriaturasBlancas_Coste2_Bulk_20261111"
    }
    
    green_cards = [c for c in all_cards if (c.get("inventory") or {}).get("bin") in green_bins]
    total_qty = sum(c.get("quantity", 1) for c in green_cards)
    print(f"Loaded {len(green_cards)} green bin items ({total_qty} physical cards) across {len(green_bins)} bins.", flush=True)

    # 2. Pre-fetch existing sets in DEV for MTG (game_id = 22)
    print("\n--- Step 1: Pre-fetching existing metadata from DEV ---", flush=True)
    sets_res = sb.table("sets").select("set_id, set_name, set_code, game_id").eq("game_id", 22).execute().data
    sets_by_name = {s["set_name"].strip().lower(): s for s in sets_res if s.get("set_name")}
    existing_codes = {s["set_code"].strip().lower() for s in sets_res if s.get("set_code")}
    
    all_sets = sb.table("sets").select("set_id").execute().data
    max_set_id = max((s["set_id"] for s in all_sets if s.get("set_id")), default=31500)
    print(f"Existing MTG sets in DEV: {len(sets_res)}, max set_id: {max_set_id}", flush=True)

    # Pre-fetch existing MTG cards into memory
    existing_cards_res = sb.table("cards").select("card_id, card_name").eq("game_id", 22).execute().data
    card_id_by_name = {c["card_name"].strip().lower(): c["card_id"] for c in existing_cards_res if c.get("card_name")}
    print(f"Existing MTG cards in DEV: {len(card_id_by_name)}", flush=True)

    # Pre-fetch existing MTG printings into memory
    existing_printings_res = sb.table("card_printings").select("printing_id, card_id, set_id, collector_number, is_foil").execute().data
    printings_map = {
        (p["card_id"], p["set_id"], str(p.get("collector_number") or "0").strip(), bool(p.get("is_foil"))): p["printing_id"]
        for p in existing_printings_res
    }
    print(f"Existing card printings in DEV: {len(printings_map)}", flush=True)

    # Pre-fetch existing products in DEV into memory
    existing_prods_res = sb.table("products").select("id, printing_id, condition, finish, stock").execute().data
    products_map = {
        (p["printing_id"], p.get("condition") or "NM", p.get("finish") or "nonfoil"): p
        for p in existing_prods_res if p.get("printing_id")
    }
    print(f"Existing products in DEV: {len(products_map)}", flush=True)

    # Resolve / Create missing sets
    print("\n--- Step 2: Resolving MTG Sets ---", flush=True)
    new_sets_created = 0
    for it in green_cards:
        pid = it.get("catalog", {}).get("productId")
        details = tcg_details.get(str(pid), {})
        raw_set_name = (details.get("setName") or "SortSwift MTG White Creatures").strip()
        custom_attrs = details.get("customAttributes") or {}
        collector_num = clean_text(custom_attrs.get("number"))
        
        norm_name = normalize_set_name(raw_set_name)
        if norm_name.lower() not in sets_by_name and raw_set_name.lower() not in sets_by_name:
            max_set_id += 1
            derived_code = derive_set_code(norm_name, collector_num)
            
            candidate_code = derived_code
            suffix = 2
            while candidate_code in existing_codes:
                candidate_code = f"{derived_code[:4]}{suffix}"
                suffix += 1
            derived_code = candidate_code
            existing_codes.add(derived_code)
            
            release_date = custom_attrs.get("releaseDate")
            if release_date and "T" in release_date:
                release_date = release_date.split("T")[0]
            
            new_set_payload = {
                "set_id": max_set_id,
                "game_id": 22,
                "set_name": raw_set_name,
                "set_code": derived_code,
                "release_date": release_date
            }
            if not dry_run:
                sb.table("sets").insert(new_set_payload).execute()
            sets_by_name[norm_name.lower()] = new_set_payload
            sets_by_name[raw_set_name.lower()] = new_set_payload
            new_sets_created += 1
            print(f"  [+] Created MTG set: [{derived_code}] {raw_set_name} (ID: {max_set_id})", flush=True)

    print(f"Sets sync done. {new_sets_created} new MTG sets added.", flush=True)

    # 3. Process Cards, Printings, and Products
    print("\n--- Step 3: Ingesting Cards, Printings & Products ---", flush=True)
    created_cards = 0
    created_printings = 0
    created_products = 0
    aggregated_products = 0

    for idx, it in enumerate(green_cards):
        ss_id = it["id"]
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
        physical_loc = map_green_bin_location(bin_name)
        
        imgs = it.get("images") or {}
        front_img = (imgs.get("front") or {}).get("url")
        cat_img = (imgs.get("catalog") or {}).get("url")
        official_img = cat_img or (f"https://tcgplayer-cdn.tcgplayer.com/product/{pid}_in_1000x1000.jpg" if pid else None) or front_img
        
        details = tcg_details.get(str(pid), {})
        card_name = (details.get("productName") or f"Card {pid}").strip()
        set_name = (details.get("setName") or "SortSwift MTG Ingestion").strip()
        custom_attrs = details.get("customAttributes") or {}
        collector_num = clean_text(custom_attrs.get("number")) or "0"
        rarity = clean_text(custom_attrs.get("rarityDbName")) or "Common"
        oracle_text = clean_text(custom_attrs.get("description"))
        release_date = custom_attrs.get("releaseDate")
        if release_date and "T" in release_date:
            release_date = release_date.split("T")[0]

        # Resolve Set
        norm_sname = normalize_set_name(set_name)
        matched_set = sets_by_name.get(norm_sname.lower()) or sets_by_name.get(set_name.lower())
        set_id = matched_set["set_id"] if matched_set else max_set_id
        set_code = matched_set["set_code"] if matched_set else derive_set_code(set_name, collector_num)
        
        type_line = clean_text(custom_attrs.get("fullType") or custom_attrs.get("cardType")) or "Creature"
        colors = ["W"]
        
        power = clean_text(custom_attrs.get("power"))
        toughness = clean_text(custom_attrs.get("toughness"))
        
        tcg_specific_attrs = {
            "power": power,
            "toughness": toughness,
            "cost": clean_text(custom_attrs.get("convertedCost") or "1"),
            "color": "White"
        }

        # 3.1 Check / Create Card
        card_key = card_name.strip().lower()
        if card_key in card_id_by_name:
            card_id = card_id_by_name[card_key]
        else:
            card_id = str(uuid.uuid4())
            card_payload = {
                "card_id": card_id,
                "game_id": 22,
                "card_name": card_name,
                "type_line": type_line,
                "oracle_text": oracle_text,
                "rarity": rarity,
                "colors": colors,
                "tcg_specific_attributes": tcg_specific_attrs
            }
            if not dry_run:
                sb.table("cards").insert(card_payload).execute()
            card_id_by_name[card_key] = card_id
            created_cards += 1

        # 3.2 Check / Create Card Printing
        printing_key = (card_id, set_id, str(collector_num).strip(), is_foil)
        if printing_key in printings_map:
            printing_id = printings_map[printing_key]
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
            printings_map[printing_key] = printing_id
            created_printings += 1

        # 3.3 Create or Update Product
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
                "game": "MTG",
                "set_code": set_code,
                "set_name": set_name,
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

        if (idx + 1) % 100 == 0 or (idx + 1) == len(green_cards):
            print(f"Processed {idx + 1}/{len(green_cards)} items (New prods: {created_products}, Aggregated: {aggregated_products})...", flush=True)

    print("\n" + "=" * 70, flush=True)
    print(" SORTSWIFT GREEN BINS INGESTION COMPLETED", flush=True)
    print(f" - New MTG Cards added: {created_cards}", flush=True)
    print(f" - New Printings created: {created_printings}", flush=True)
    print(f" - New Products created: {created_products}", flush=True)
    print(f" - Existing Products aggregated: {aggregated_products}", flush=True)
    print(f" - Total Physical Units Ingested: {total_qty}", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes live to DEV Supabase")
    args = parser.parse_args()
    
    run_sync(dry_run=not args.apply)
