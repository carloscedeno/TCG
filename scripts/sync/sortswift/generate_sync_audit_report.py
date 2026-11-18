import os
import sys
import json
import csv
import shutil
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / ".env")

from scripts.sync.common.db import get_supabase

CATEGORY_MAP = {
    1: {"game_code": "MTG", "name": "Magic: The Gathering"},
    3: {"game_code": "PKM", "name": "Pokémon"},
    13: {"game_code": "OPC", "name": "One Piece TCG"},
    62: {"game_code": "FAB", "name": "Flesh and Blood"},
    63: {"game_code": "DGM", "name": "Digimon"},
    68: {"game_code": "OPC", "name": "One Piece TCG"},
    86: {"game_code": "GND", "name": "Gundam Card Game"},
    89: {"game_code": "RFB", "name": "Riftbound"},
}

def generate_report():
    sb = get_supabase()
    print(f"[Audit] Connecting to Supabase DEV: {sb.supabase_url}")

    # 1. Load SortSwift snapshot and TCG details cache
    snapshot_path = PROJECT_ROOT / "scripts/sync/sortswift/prod_sortswift_cards.json"
    cache_path = PROJECT_ROOT / "scripts/sync/sortswift/tcgplayer_details_cache.json"

    if not snapshot_path.exists():
        print(f"Error: {snapshot_path} not found.")
        return

    raw_cards = json.loads(snapshot_path.read_text(encoding="utf-8"))
    tcg_cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}

    print(f"[Audit] Loaded {len(raw_cards)} SortSwift raw items.")

    # 2. Fetch existing products from Supabase DEV
    # Paginate products to avoid 1000 limit
    existing_products = []
    page_size = 1000
    offset = 0
    while True:
        res = sb.table("products").select("id, name, game, set_code, printing_id, condition, finish, stock, price, physical_location, barcode, sortswift_id").range(offset, offset + page_size - 1).execute()
        data = res.data or []
        existing_products.extend(data)
        if len(data) < page_size:
            break
        offset += page_size

    print(f"[Audit] Loaded {len(existing_products)} existing products from Supabase DEV.")

    # Map existing products by printing_id + condition + finish, and by barcode / sortswift_id
    existing_by_key = {}
    for p in existing_products:
        key = (p.get("printing_id"), (p.get("condition") or "NM").upper(), (p.get("finish") or "nonfoil").lower())
        existing_by_key[key] = p

    existing_by_ss_id = {p.get("sortswift_id"): p for p in existing_products if p.get("sortswift_id")}
    existing_by_barcode = {p.get("barcode"): p for p in existing_products if p.get("barcode")}

    # Also map card_printings to get printing_id lookup
    all_printings = []
    offset = 0
    while True:
        res = sb.table("card_printings").select("printing_id, api_source_id, collector_number, is_foil").range(offset, offset + page_size - 1).execute()
        data = res.data or []
        all_printings.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    
    printings_by_tcg_id = {}
    for pr in all_printings:
        src_id = pr.get("api_source_id")
        if src_id:
            foil_key = (str(src_id), bool(pr.get("is_foil")))
            printings_by_tcg_id[foil_key] = pr.get("printing_id")

    # 3. Analyze SortSwift items vs DB
    rows_detail = []
    tcg_summary = {}

    def get_tcg_stats(game):
        if game not in tcg_summary:
            tcg_summary[game] = {
                "agregados": 0,
                "unidades_agregadas": 0,
                "actualizados": 0,
                "unidades_actualizadas": 0,
                "en_cero": 0,
                "unidades_en_cero": 0,
                "total_items_ss": 0,
                "total_units_ss": 0,
            }
        return tcg_summary[game]

    matched_db_product_ids = set()

    for item in raw_cards:
        ss_id = item.get("id")
        cat_id = item.get("catalog", {}).get("categoryId")
        pid = item.get("catalog", {}).get("productId")
        barcode = item.get("barcode") or f"GEEKO-{ss_id[-8:].upper()}"
        variant = item.get("variant") or {}
        condition = (variant.get("condition") or "NM").upper()
        printing_finish = variant.get("printing") or "Normal"
        is_foil = "foil" in printing_finish.lower()
        finish = "foil" if is_foil else "nonfoil"
        qty = int(item.get("quantity") or 1)
        price = float(item.get("price", {}).get("amount") or 0.0)
        cost = float(item.get("cost", {}).get("amount") or 0.0)
        bin_name = item.get("inventory", {}).get("bin") or "PENDIENTE"

        game_info = CATEGORY_MAP.get(cat_id, {"game_code": "OTHERS", "name": "Otros"})
        game_code = game_info["game_code"]
        stats = get_tcg_stats(game_code)

        stats["total_items_ss"] += 1
        stats["total_units_ss"] += qty

        # Lookup card name & set from TCGplayer cache
        details = tcg_cache.get(str(pid), {})
        card_name = details.get("productName") or f"Item {ss_id[:8]}"
        set_name = details.get("setName") or "Unknown Set"
        custom_attrs = details.get("customAttributes") or {}
        collector_num = custom_attrs.get("number") or ""

        # Check if already in DB
        matched_prod = existing_by_ss_id.get(ss_id) or existing_by_barcode.get(barcode)
        if not matched_prod and pid:
            pr_id = printings_by_tcg_id.get((str(pid), is_foil))
            if pr_id:
                matched_prod = existing_by_key.get((pr_id, condition, finish))

        if matched_prod:
            matched_db_product_ids.add(matched_prod.get("id"))
            current_db_stock = matched_prod.get("stock") or 0
            stats["actualizados"] += 1
            stats["unidades_actualizadas"] += qty
            action = "STOCK_ACTUALIZADO"
            delta = f"DB: {current_db_stock} -> SS: +{qty}"
        else:
            stats["agregados"] += 1
            stats["unidades_agregadas"] += qty
            action = "NUEVO_AGREGADO"
            delta = f"Nuevo: +{qty}"

        rows_detail.append({
            "sortswift_id": ss_id,
            "barcode": barcode,
            "game": game_code,
            "set_name": set_name,
            "collector_number": collector_num,
            "card_name": card_name,
            "condition": condition,
            "finish": finish,
            "quantity_ss": qty,
            "price_usd": price,
            "cost_usd": cost,
            "bin_location": bin_name,
            "action": action,
            "stock_impact": delta
        })

    # 4. Detect items in DB that are NOT in SortSwift or were zeroed out
    for p in existing_products:
        pid = p.get("id")
        stock = p.get("stock") or 0
        game = p.get("game") or "OTHERS"
        stats = get_tcg_stats(game)

        if pid not in matched_db_product_ids:
            if stock > 0:
                stats["en_cero"] += 1
                stats["unidades_en_cero"] += stock
                rows_detail.append({
                    "sortswift_id": p.get("sortswift_id") or "N/A",
                    "barcode": p.get("barcode") or "N/A",
                    "game": game,
                    "set_name": p.get("set_code") or "N/A",
                    "collector_number": "",
                    "card_name": p.get("name") or "Sin Nombre",
                    "condition": p.get("condition") or "NM",
                    "finish": p.get("finish") or "nonfoil",
                    "quantity_ss": 0,
                    "price_usd": float(p.get("price") or 0.0),
                    "cost_usd": 0.0,
                    "bin_location": p.get("physical_location") or "SISTEMA",
                    "action": "SIN_STOCK_EN_SORTSWIFT",
                    "stock_impact": f"Stock local: {stock} -> Sin lote físico activo"
                })

    # 5. Write CSV file
    out_dir = PROJECT_ROOT / "docs/reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_file = out_dir / "sortswift_sync_audit_detail.csv"

    fieldnames = [
        "sortswift_id", "barcode", "game", "set_name", "collector_number",
        "card_name", "condition", "finish", "quantity_ss", "price_usd",
        "cost_usd", "bin_location", "action", "stock_impact"
    ]

    with open(csv_file, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_detail)

    print(f"\n[CSV] Report saved to {csv_file}")

    # Copy to Artifact directory if available
    artifact_dir = Path(r"C:\Users\carlo\.gemini\antigravity\brain\42537e32-9fb4-40b0-9ab3-938379399f08")
    if artifact_dir.exists():
        dest_csv = artifact_dir / "sortswift_sync_audit_detail.csv"
        shutil.copyfile(csv_file, dest_csv)
        print(f"[CSV] Copied to Artifact Dir: {dest_csv}")

    # 6. Save JSON Summary
    summary_path = out_dir / "sortswift_sync_summary.json"
    summary_data = {
        "total_sortswift_items": len(raw_cards),
        "total_sortswift_units": sum(int(c.get("quantity") or 1) for c in raw_cards),
        "total_db_products": len(existing_products),
        "by_tcg": tcg_summary
    }
    summary_path.write_text(json.dumps(summary_data, indent=2), encoding="utf-8")

    print("\n" + "=" * 80)
    print(" RESUMEN AUDITORÍA DE SINCRONIZACIÓN SORTSWIFT POR JUEGO (TCG)")
    print("=" * 80)
    print(f"{'TCG':<8} | {'NUEVOS (Items)':<14} | {'NUEVOS (Units)':<14} | {'ACTUALIZADOS':<12} | {'SIN STOCK EN SS':<16} | {'TOTAL SS':<10}")
    print("-" * 80)
    for g, s in sorted(tcg_summary.items()):
        print(f"{g:<8} | {s['agregados']:<14} | {s['unidades_agregadas']:<14} | {s['actualizados']:<12} | {s['en_cero']:<16} | {s['total_units_ss']:<10}")
    print("=" * 80)

if __name__ == "__main__":
    generate_report()
