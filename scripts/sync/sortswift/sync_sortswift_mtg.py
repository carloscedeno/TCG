import os
import sys
import uuid
import argparse
import logging
from pathlib import Path
from dotenv import load_dotenv

# Ensure paths
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
logger = logging.getLogger("SyncSortSwiftMTG")

# Location mapping helper from store physical layout
def map_bin_to_store_location(bin_name: str, condition: str = "NM", finish: str = "nonfoil") -> str:
    """
    Translates SortSwift warehouse bin names into Geekorium's 4-level store coordinate:
    [ESTANTERÍA]-[ENTREPAÑO]-[CONTENEDOR]-[CATEGORÍA]
    """
    if not bin_name:
        return "E1-N10-B01-PENDIENTE"
        
    bin_upper = bin_name.upper().strip()
    
    if "VAULT" in bin_upper or "GRADE" in condition.upper():
        # High value vitrina
        return "E3-N01-V01-MTG-ALTOVALOR"
    elif bin_upper in ["A-01", "BIN-A1"]:
        return "E1-N01-F01-MTG-W"  # White
    elif bin_upper in ["A-02", "BIN-A2"]:
        return "E1-N02-F01-MTG-U"  # Blue
    elif bin_upper in ["A-03", "BIN-A3"]:
        return "E1-N03-F01-MTG-B"  # Black
    elif "BULK" in bin_upper:
        return "E2-N04-B01-BULK"    # Bulk storage
    else:
        return f"E1-N09-B01-{bin_upper}"

def run_sync(dry_run: bool = True):
    mode_str = "SIMULATION (DRY-RUN - NO CHANGES)" if dry_run else "LIVE SYNC (DEV APPLIED)"
    logger.info("=" * 65)
    logger.info(f"   STARTING SORTSWIFT MTG INVENTORY SYNC [{mode_str}]")
    logger.info("   RULE: SortSwift controls ONLY Stock & Physical Location.")
    logger.info("   Prices, Images, and Metadata remain 100% untouched.")
    logger.info("=" * 65)
    
    # 1. Initialize SortSwift Client
    api_key = os.getenv("SORTSWIFT_API_KEY", "ss_inv_sbx_e56e17c7ca1fe8dcc88650edcd0bc654f6a37803a64f6e6b54debdcc6d39c358")
    client = SortSwiftClient(api_key=api_key, enforce_sandbox=True)
    
    # 2. Initialize Supabase DEV
    sb = get_supabase()
    
    # 3. Fetch RAW Cards from SortSwift
    logger.info("Fetching RAW Cards from SortSwift API...")
    res = client.get_raw_cards(include_deleted=False)
    raw_cards = res.get("data", [])
    logger.info(f"Retrieved {len(raw_cards)} cards from SortSwift.")
    
    # 4. Filter for MTG only (categoryId == 1 in SortSwift corresponds to Magic: The Gathering)
    mtg_cards = [c for c in raw_cards if c.get("catalog", {}).get("categoryId") == 1]
    logger.info(f"Filtered {len(mtg_cards)}/{len(raw_cards)} MTG cards to process.")
    
    synced_count = 0
    unlinked_count = 0
    
    for item in mtg_cards:
        raw_id = item["id"]
        external_id = item.get("externalId")
        item_barcode = item.get("barcode")
        variant = item.get("variant", {})
        cost_obj = item.get("cost", {})
        inv_obj = item.get("inventory", {})
        
        condition = variant.get("condition", "NM")
        printing = variant.get("printing", "Normal")
        finish = "foil" if "foil" in printing.lower() else "nonfoil"
        qty = int(item.get("quantity", 0))
        bin_name = inv_obj.get("bin", "")
        
        try:
            cost = float(cost_obj.get("amount", 0.0))
        except (ValueError, TypeError):
            cost = 0.0
            
        # Calculate Physical Location in Store based on physical layout
        physical_loc = map_bin_to_store_location(bin_name, condition=condition, finish=finish)
        
        # Unit barcode (preserve existing or assign standard format)
        barcode = item_barcode or f"GEEKO-{raw_id[-8:].upper()}"
        
        # Find corresponding Geekorium product
        # Priority: 1. externalId -> 2. sortswift_id -> 3. barcode
        prod = None
        if external_id:
            res_ext = sb.table("products").select("id, name, stock, price, price_usd, image_url, physical_location, barcode, sortswift_id").eq("id", external_id).execute()
            if res_ext.data and len(res_ext.data) > 0:
                prod = res_ext.data[0]
                
        if not prod:
            res_ss = sb.table("products").select("id, name, stock, price, price_usd, image_url, physical_location, barcode, sortswift_id").eq("sortswift_id", raw_id).execute()
            if res_ss.data and len(res_ss.data) > 0:
                prod = res_ss.data[0]
                
        if not prod and barcode:
            res_bc = sb.table("products").select("id, name, stock, price, price_usd, image_url, physical_location, barcode, sortswift_id").eq("barcode", barcode).execute()
            if res_bc.data and len(res_bc.data) > 0:
                prod = res_bc.data[0]
                
        if not prod:
            logger.warning(f"[UNLINKED] SortSwift RAW Card {raw_id} (Bin: {bin_name}, Qty: {qty}) is not linked to any Geekorium product. (No externalId/barcode match).")
            unlinked_count += 1
            continue
            
        prod_id = prod["id"]
        prod_name = prod["name"]
        old_stock = prod.get("stock", 0)
        current_price = prod.get("price")
        
        # INVENTORY-ONLY PAYLOAD
        # Prices, images, and card info are strictly PRESERVED and NEVER modified by SortSwift
        update_payload = {
            "stock": qty,
            "physical_location": physical_loc,
            "sortswift_id": raw_id,
            "barcode": barcode
        }
        if cost > 0:
            update_payload["cost"] = cost
            
        logger.info(f"[MATCHED] {prod_name} (ID: {prod_id}):")
        logger.info(f"     Stock:             {old_stock} -> {qty}")
        logger.info(f"     Store Location:    {physical_loc} (SortSwift Bin: '{bin_name}')")
        logger.info(f"     Barcode:           {barcode}")
        logger.info(f"     Cost:              ${cost:.2f}")
        logger.info(f"     PRICE & IMAGE:     PRESERVED (${current_price} | Untouched)")
        
        if not dry_run:
            # 1. Update ONLY inventory columns in Supabase DEV
            sb.table("products").update(update_payload).eq("id", prod_id).execute()
            
            # 2. Patch SortSwift with our Supabase externalId and barcode
            try:
                client.patch_raw_card(raw_id, external_id=prod_id, barcode=barcode)
                logger.info(f"     -> Two-way sync confirmed in SortSwift externalId.")
            except Exception as pe:
                logger.warning(f"     -> Could not patch SortSwift: {pe}")
                
        synced_count += 1
        logger.info("-" * 55)
        
    logger.info("=" * 65)
    logger.info(f"SYNC SUMMARY: {synced_count} MTG cards synchronized.")
    logger.info(f"   Unlinked: {unlinked_count}")
    if dry_run:
        logger.info("   Mode: DRY-RUN (No database records were altered). Run with --apply to commit.")
    else:
        logger.info("   Mode: APPLIED TO DEV DATABASE & SORTSWIFT!")
    logger.info("=" * 65)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync MTG cards from SortSwift to Geekorium Supabase DEV")
    parser.add_argument("--apply", action="store_true", help="Apply changes to DEV Supabase and SortSwift")
    args = parser.parse_args()
    
    run_sync(dry_run=not args.apply)
