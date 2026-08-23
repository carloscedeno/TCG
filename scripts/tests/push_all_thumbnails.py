import sys, os, base64, time, logging
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("BulkImageUpload")

supabase = get_supabase()
odoo = OdooClient()

def fetch_b64_thumbnail(url):
    if not url:
        return None
    try:
        small_url = url.replace('/normal/', '/small/')
        resp = requests.get(small_url, timeout=10, headers={'User-Agent': 'GeekoriumApp/1.0'})
        if resp.status_code == 200:
            return base64.b64encode(resp.content).decode('utf-8')
    except Exception as e:
        logger.warning(f"Failed to fetch image {url}: {e}")
    return None

def main():
    logger.info("Starting bulk upload of 16k thumbnails to Odoo...")
    batch_size = 200
    start = 0
    total_processed = 0
    total_updated = 0
    
    while True:
        # Fetch a batch of products from Supabase
        res = supabase.table('products').select('id, image_url').order('id').range(start, start + batch_size - 1).execute()
        items = res.data
        if not items:
            break
            
        codes = [str(item['id']) for item in items]
        
        # Find which of these exist in Odoo
        odoo_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read', [[['default_code', 'in', codes]]], {'fields': ['id', 'default_code']})
            
        existing_code_to_id = {p['default_code']: p['id'] for p in odoo_products}
        
        for item in items:
            code = str(item['id'])
            if code in existing_code_to_id:
                odoo_id = existing_code_to_id[code]
                b64_img = fetch_b64_thumbnail(item.get('image_url'))
                if b64_img:
                    try:
                        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [[odoo_id], {'image_1920': b64_img}])
                        total_updated += 1
                    except Exception as e:
                        logger.error(f"Failed to update image for {code}: {e}")
                    # Sleep slightly to respect Scryfall API limits and not hammer Odoo too much
                    time.sleep(0.15)
                    
        total_processed += len(items)
        logger.info(f"Processed {total_processed} items... Updated {total_updated} images so far.")
        start += batch_size
        
    logger.info(f"DONE! Processed {total_processed} singles and updated {total_updated} images in Odoo.")

if __name__ == "__main__":
    main()
