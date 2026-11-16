import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import requests

root_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(root_dir / ".env")
load_dotenv(root_dir / "supabase" / ".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SyncSortSwiftToOdoo")

GAME_CATEGORY_MAP = {
    "MTG": 10,
    "Magic": 10,
    "PKM": 28,
    "Pokemon": 28,
    "YGO": 30,
    "Yu-Gi-Oh": 30,
    "OPC": 20,
    "One Piece": 20,
    "DGM": 26,
    "Digimon": 26,
    "FAB": 18,
    "Flesh & Blood": 18,
    "GDM": 24,
    "Gundam": 24,
}
DEFAULT_CATEGORY_ID = 34  # TCG / Otros / Singles
LOCATION_ID = 5           # WH/Stock

def json_rpc(url, db, uid, password, model, method, args, kwargs=None):
    payload = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "service": "object",
            "method": "execute_kw",
            "args": [db, uid, password, model, method, args] + ([kwargs] if kwargs else [])
        },
        "id": 1
    }
    r = requests.post(f"{url}/jsonrpc", json=payload, timeout=90)
    res = r.json()
    if "error" in res:
        err_data = res["error"].get("data", {}).get("message") or res["error"].get("message")
        raise RuntimeError(f"Odoo JSON-RPC Error: {err_data}")
    return res.get("result")

def run_sync(limit_items=None):
    logger.info("==================================================")
    logger.info("STARTING SORTSWIFT -> ODOO INVENTORY SYNC (BATCHED)")
    logger.info("==================================================")

    url = os.environ.get("ODOO_URL")
    db = os.environ.get("ODOO_DB")
    user = os.environ.get("ODOO_USERNAME")
    password = os.environ.get("ODOO_API_KEY")

    if not all([url, db, user, password]):
        logger.error("Missing Odoo credentials.")
        sys.exit(1)

    # 1. Authenticate via JSON-RPC
    auth_res = requests.post(f"{url}/jsonrpc", json={
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "service": "common",
            "method": "authenticate",
            "args": [db, user, password, {}]
        },
        "id": 1
    }).json()
    uid = auth_res.get("result")
    if not uid:
        logger.error(f"Failed to authenticate with Odoo JSON-RPC: {auth_res}")
        sys.exit(1)
    logger.info(f"Connected to Odoo UID: {uid}")

    # 2. Fetch existing products from Odoo
    logger.info("Fetching existing product codes from Odoo...")
    odoo_map = {}
    offset = 0
    batch_size = 10000
    while True:
        prods = json_rpc(url, db, uid, password, "product.product", "search_read", [[]],
                         {"fields": ["id", "default_code", "list_price", "qty_available"], "limit": batch_size, "offset": offset})
        for p in prods:
            code = p.get("default_code")
            if code:
                odoo_map[code] = p
        if len(prods) < batch_size:
            break
        offset += batch_size
    logger.info(f"Loaded {len(odoo_map)} existing products from Odoo.")

    # 3. Fetch products with stock > 0 from Supabase
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not found.")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    query = """
        SELECT id, name, set_code, finish, condition, price, stock, game
        FROM products
        WHERE stock > 0
        ORDER BY updated_at DESC
    """
    if limit_items:
        query += f" LIMIT {limit_items}"
    cur.execute(query)
    supa_items = cur.fetchall()
    logger.info(f"Retrieved {len(supa_items)} products with active stock from Supabase.")

    to_create = []
    to_update_stock = []

    for item in supa_items:
        p_id, name, set_code, finish, condition, price, stock, game = item
        code_str = str(p_id)
        
        finish_str = " (Foil)" if finish == "foil" else ""
        s_code = (set_code or "UNK").upper()
        cond = condition or "NM"
        full_name = f"[{s_code}] {name}{finish_str} - {cond}"
        cat_id = GAME_CATEGORY_MAP.get(game, DEFAULT_CATEGORY_ID)
        unit_price = float(price) if price else 0.0

        if code_str not in odoo_map:
            to_create.append({
                "supa_id": code_str,
                "vals": {
                    "name": full_name,
                    "default_code": code_str,
                    "list_price": unit_price,
                    "available_in_pos": True,
                    "is_storable": True,
                    "categ_id": cat_id,
                },
                "stock": stock
            })
        else:
            existing = odoo_map[code_str]
            # Only update if stock differs
            if existing.get("qty_available", 0) != float(stock):
                to_update_stock.append({
                    "odoo_id": existing["id"],
                    "stock": stock
                })

    logger.info(f"New products to create in Odoo: {len(to_create)}")
    logger.info(f"Products requiring stock update in Odoo: {len(to_update_stock)}")

    # 4. Batch Create missing products in Odoo
    created_total = 0
    create_chunk_size = 100
    for i in range(0, len(to_create), create_chunk_size):
        chunk = to_create[i:i + create_chunk_size]
        payloads = [c["vals"] for c in chunk]
        try:
            new_ids = json_rpc(url, db, uid, password, "product.product", "create", [payloads])
            for idx, n_id in enumerate(new_ids):
                to_update_stock.append({
                    "odoo_id": n_id,
                    "stock": chunk[idx]["stock"]
                })
            created_total += len(new_ids)
            logger.info(f"  Created {created_total}/{len(to_create)} new products in Odoo...")
        except Exception as e:
            logger.error(f"  Error creating chunk {i}: {e}")

    # 5. High-Speed Batched Stock Update (stock.quant)
    logger.info(f"Applying inventory quantities for {len(to_update_stock)} items in Odoo (Batched)...")
    stock_chunk_size = 100
    applied_total = 0
    for i in range(0, len(to_update_stock), stock_chunk_size):
        chunk = to_update_stock[i:i + stock_chunk_size]
        payloads = [{
            "product_id": c["odoo_id"],
            "location_id": LOCATION_ID,
            "inventory_quantity": float(c["stock"])
        } for c in chunk]

        try:
            quant_ids = json_rpc(url, db, uid, password, "stock.quant", "create", [payloads])
            if quant_ids:
                json_rpc(url, db, uid, password, "stock.quant", "action_apply_inventory", [quant_ids])
                applied_total += len(quant_ids)
                if applied_total % 500 == 0 or applied_total == len(to_update_stock):
                    logger.info(f"  Applied stock to {applied_total}/{len(to_update_stock)} products...")
        except Exception as e:
            logger.error(f"  Error applying inventory chunk {i}: {e}")

    logger.info("==================================================")
    logger.info(f"SORTSWIFT -> ODOO SYNC COMPLETE!")
    logger.info(f"  Created in Odoo: {created_total}")
    logger.info(f"  Stock Synchronized: {applied_total}")
    logger.info("==================================================")

if __name__ == "__main__":
    run_sync()
