import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CleanupOldProducts")

odoo = OdooClient()
db = get_supabase()

# 1. Find all categories that are Singles
cats = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'search_read', [[]], {'fields': ['id', 'name']})
single_cat_ids = [c['id'] for c in cats if 'Singles' in c['name']]

# 2. Find old products in Odoo created before Aug 20, 2026, that are NOT in Singles categories
domain = [
    ('create_date', '<', '2026-08-20 00:00:00'),
    ('categ_id', 'not in', single_cat_ids)
]

old_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [domain], {'fields': ['id', 'name', 'create_date', 'categ_id']})

logger.info(f"Found {len(old_products)} OLD non-single products created before Aug 20.")

if old_products:
    for p in old_products:
        logger.info(f"Deleting from Odoo: {p['name']} (Created: {p['create_date']}, Categ: {p['categ_id'][1] if p['categ_id'] else 'None'})")
    
    # Extract IDs to delete
    product_ids_to_delete = [p['id'] for p in old_products]
    
    # Delete from Odoo
    try:
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'unlink', [product_ids_to_delete])
        logger.info("Successfully deleted old products from Odoo.")
    except Exception as e:
        logger.error(f"Failed to delete products from Odoo: {e}")
        
    # Also clean up Supabase accessories table just to be perfectly synced
    # We delete anything in `accessories` whose odoo_id was just deleted
    logger.info("Cleaning up Supabase accessories table...")
    for chunk in [product_ids_to_delete[i:i + 100] for i in range(0, len(product_ids_to_delete), 100)]:
        try:
            db.table('accessories').delete().in_('odoo_id', chunk).execute()
        except Exception as e:
            logger.error(f"Error cleaning Supabase accessories: {e}")
    logger.info("Supabase cleanup complete.")
else:
    logger.info("No old products found to delete.")
