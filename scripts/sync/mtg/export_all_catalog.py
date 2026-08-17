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

logger = setup_logging("Export_All_Catalog")

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
    small_url = url.replace('/normal/', '/small/')
    headers = {'User-Agent': 'TCGHub/1.0', 'Accept': 'image/*'}
    try:
        time.sleep(0.1)
        resp = requests.get(small_url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return base64.b64encode(resp.content).decode('utf-8')
    except Exception as e:
        logger.warning(f"Failed to fetch image {small_url}: {e}")
    return None

def run_export_all():
    logger.info("--- Starting Global Odoo Export ---")
    supabase = get_supabase()
    odoo = OdooClient()
    
    if not odoo.uid:
        logger.error("Odoo authentication failed. Cannot proceed.")
        return
        
    cat_juegos_id = ensure_category(odoo, "Juegos TCG")
    cat_accesorios_gen_id = ensure_category(odoo, "Accesorios Generales")
    
    # 1. Fetch Games from Supabase
    logger.info("Fetching games...")
    games_res = supabase.table('games').select('*').execute().data
    game_map = {}
    for g in games_res:
        game_name = g.get('game_name', g.get('game_code'))
        if not game_name: continue
        game_cat_id = ensure_category(odoo, game_name, cat_juegos_id)
        game_map[g['game_id']] = {
            'name': game_name,
            'code': g['game_code'],
            'odoo_cat_id': game_cat_id,
            'singles_cat_id': ensure_category(odoo, "Singles", game_cat_id)
        }
        
    # Mapping game string codes from products to game_ids/cat_ids
    str_game_to_singles_cat = {}
    for g_id, g_info in game_map.items():
        if g_info['code']:
            str_game_to_singles_cat[g_info['code'].upper()] = g_info['singles_cat_id']
            
    # Default singles category if game not found
    default_singles_cat_id = ensure_category(odoo, "Otros Singles", cat_juegos_id)

    # 2. Export Products (Singles)
    logger.info("--- Phase 1: Exporting Products (Singles) ---")
    batch_size = 500
    start = 0
    total_products = 0
    
    while True:
        logger.info(f"Fetching Supabase products [{start} to {start + batch_size - 1}]...")
        res = supabase.table('products').select('*').order('id').range(start, start + batch_size - 1).execute()
        items = res.data
        if not items:
            break
            
        codes = [str(item['id']) for item in items]
        odoo_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read', [[['default_code', 'in', codes]]], {'fields': ['id', 'default_code']})
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
                
            game_code = (item.get('game') or '').upper()
            categ_id = str_game_to_singles_cat.get(game_code, default_singles_cat_id)
            
            payload = {
                'name': name,
                'default_code': str(item['id']),
                'list_price': list_price,
                'categ_id': categ_id,
            }
            
            code = str(item['id'])
            if code in existing_code_to_id:
                to_update.append((existing_code_to_id[code], payload))
            else:
                # b64_image = fetch_image_b64(item.get('image_url'))
                # if b64_image:
                #     payload['image_1920'] = b64_image
                to_create.append(payload)
                
        if to_create:
            logger.info(f"Bulk creating {len(to_create)} new products...")
            try:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'create', [to_create])
            except Exception as e:
                logger.error(f"Failed bulk create: {e}")
                
        for odoo_id, vals in to_update:
            try:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[odoo_id], vals])
            except Exception as e:
                logger.error(f"Failed to update {odoo_id}: {e}")
                
        total_products += len(items)
        start += batch_size
        
    logger.info(f"Phase 1 Complete. Total singles processed: {total_products}")

    # 3. Export Accessories / Sealed
    logger.info("--- Phase 2: Exporting Accessories / Sealed ---")
    res = supabase.table('accessories').select('*').order('id').execute()
    accessories = res.data
    logger.info(f"Found {len(accessories)} accessories.")
    
    codes = [str(item['id']) for item in accessories]
    odoo_accs = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
        'product.product', 'search_read', [[['default_code', 'in', codes]]], {'fields': ['id', 'default_code']})
    existing_acc_to_id = {p['default_code']: p['id'] for p in odoo_accs}
    
    acc_to_create = []
    acc_to_update = []
    
    # Pre-cache category IDs
    cat_cache = {}
    
    for item in accessories:
        name = item.get('name', 'Unknown')
        list_price = float(item.get('price') or 0.0)
        if item.get('discount_percentage'):
            list_price = list_price * (1.0 - (float(item['discount_percentage']) / 100.0))
            
        game_id = item.get('game_id')
        category_name = item.get('category') or 'Otros'
        
        # Determine category hierarchy
        if game_id and game_id in game_map:
            # Belongs to a game: Juegos TCG > [Game] > [Category]
            parent_cat_id = game_map[game_id]['odoo_cat_id']
        else:
            # Generic accessory: Accesorios Generales > [Category]
            parent_cat_id = cat_accesorios_gen_id
            
        cat_key = f"{parent_cat_id}_{category_name}"
        if cat_key not in cat_cache:
            cat_cache[cat_key] = ensure_category(odoo, category_name, parent_cat_id)
        
        categ_id = cat_cache[cat_key]
        
        payload = {
            'name': name,
            'default_code': str(item['id']),
            'list_price': list_price,
            'categ_id': categ_id,
        }
        
        code = str(item['id'])
        if code in existing_acc_to_id:
            acc_to_update.append((existing_acc_to_id[code], payload, item['id']))
        else:
            # Note: User explicitly asked to NOT sync images for accessories to save space
            acc_to_create.append((payload, item['id']))
            
    # Process Accessory Creations
    if acc_to_create:
        logger.info(f"Creating {len(acc_to_create)} new accessories...")
        for payload, sb_id in acc_to_create:
            try:
                odoo_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'create', [payload])
                # Link back to supabase
                supabase.table('accessories').update({'odoo_id': odoo_id}).eq('id', sb_id).execute()
            except Exception as e:
                logger.error(f"Failed to create accessory {payload.get('name')}: {e}")
                
    # Process Accessory Updates
    if acc_to_update:
        logger.info(f"Updating {len(acc_to_update)} existing accessories...")
    for odoo_id, payload, sb_id in acc_to_update:
        try:
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[odoo_id], payload])
            # Ensure supabase has the odoo_id just in case
            supabase.table('accessories').update({'odoo_id': odoo_id}).eq('id', sb_id).execute()
        except Exception as e:
            logger.error(f"Failed to update accessory {odoo_id}: {e}")

    logger.info("--- Global Odoo Export Complete ---")

if __name__ == '__main__':
    run_export_all()
