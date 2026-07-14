import os
import sys
import logging
import base64
import requests
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent.parent / "supabase" / ".env.local")
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent))

from common.db import get_supabase, setup_logging
from common.odoo_client import OdooClient

logger = setup_logging("Bulk_Odoo_Export_Images")

def ensure_category(odoo: OdooClient, name: str, parent_id: int = None):
    domain = [['name', '=', name]]
    if parent_id:
        domain.append(['parent_id', '=', parent_id])
    search_res = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
        'product.category', 'search', [domain], {'limit': 1})
    if search_res:
        return search_res[0]
    create_data = {'name': name}
    if parent_id:
        create_data['parent_id'] = parent_id
    return odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
        'product.category', 'create', [create_data])

def fetch_image_b64(url: str):
    if not url: return None
    # Use lowest quality image from Scryfall to save Odoo DB space
    small_url = url.replace('/normal/', '/small/')
    
    headers = {
        'User-Agent': 'TCGHub/1.0',
        'Accept': 'image/*'
    }
    try:
        # Respect Scryfall's rate limit
        time.sleep(0.1)
        resp = requests.get(small_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return base64.b64encode(resp.content).decode('utf-8')
        else:
            logger.warning(f"Failed to fetch image {small_url}: {resp.status_code} - {resp.text[:100]}")
    except Exception as e:
        logger.warning(f"Failed to fetch image {small_url}: {e}")
    return None

def run_bulk_export():
    logger.info("--- Starting Bulk Odoo Export (WITH SMALL IMAGES) ---")
    supabase = get_supabase()
    odoo = OdooClient()
    
    if not odoo.uid:
        logger.error("Odoo authentication failed. Cannot proceed.")
        return
        
    cat_juegos_id = ensure_category(odoo, "Juegos TCG")
    cat_mtg_id = ensure_category(odoo, "MTG", cat_juegos_id)
    cat_singles_id = ensure_category(odoo, "Singles", cat_mtg_id)
    
    # Smaller batch size to prevent 504 Gateway Timeout in Odoo XML-RPC
    batch_size = 25
    start = 0
    total_processed = 0
    
    while True:
        logger.info(f"Fetching Supabase products [{start} to {start + batch_size - 1}]...")
        res = supabase.table('products').select('*').eq('game', 'MTG').order('id').range(start, start + batch_size - 1).execute()
        items = res.data
        if not items:
            break
            
        codes = [str(item['id']) for item in items]
        odoo_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[['default_code', 'in', codes]]],
            {'fields': ['id', 'default_code']}
        )
        existing_code_to_id = {p['default_code']: p['id'] for p in odoo_products}
        
        to_create = []
        to_update = []
        
        for item in items:
            finish_str = ' (Foil)' if item.get('finish') == 'foil' else ''
            set_code = item.get('set_code', 'UNK').upper()
            cond = item.get('condition', 'NM')
            name = f"[{set_code}] {item.get('name', 'Unknown')}{finish_str} - {cond}"
            
            list_price = float(item.get('price') or 0.0)
            if item.get('discount_percentage'):
                list_price = list_price * (1.0 - (float(item['discount_percentage']) / 100.0))
                
            payload = {
                'name': name,
                'default_code': str(item['id']),
                'list_price': list_price,
                'categ_id': cat_singles_id,
            }
            
            code = str(item['id'])
            if code in existing_code_to_id:
                # Optimization: Skip existing products ENTIRELY to speed up sync
                continue
            else:
                # Fetch base64 image only for new products
                b64_image = fetch_image_b64(item.get('image_url'))
                if b64_image:
                    payload['image_1920'] = b64_image
                to_create.append(payload)
                
        if to_create:
            logger.info(f"Bulk creating {len(to_create)} new products...")
            try:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
                    'product.product', 'create', [to_create]
                )
            except Exception as e:
                logger.error(f"Failed bulk create: {e}")
                
        for odoo_id, vals in to_update:
            try:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
                    'product.product', 'write', [[odoo_id], vals]
                )
            except Exception as e:
                logger.error(f"Failed to update {odoo_id}: {e}")
                
        total_processed += len(items)
        start += batch_size
        logger.info(f"--- Batch Complete. Total processed: {total_processed} ---")

if __name__ == '__main__':
    run_bulk_export()
