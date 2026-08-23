import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DeduplicateCats")

odoo = OdooClient()

# Get all categories
cats = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'search_read', [[]], {'fields': ['id', 'name', 'parent_id']})

# Group by (parent_id, name)
groups = {}
for c in cats:
    parent = c['parent_id'][0] if c['parent_id'] else None
    key = (parent, c['name'])
    if key not in groups:
        groups[key] = []
    groups[key].append(c['id'])

for key, ids in groups.items():
    if len(ids) > 1:
        master_id = ids[0]
        duplicate_ids = ids[1:]
        logger.info(f"Found duplicate for {key}: master {master_id}, duplicates {duplicate_ids}")
        
        for dup_id in duplicate_ids:
            # Move children
            children = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'search', [[('parent_id', '=', dup_id)]])
            if children:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'write', [children, {'parent_id': master_id}])
            
            # Move products
            products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search', [[('categ_id', '=', dup_id)]])
            if products:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [products, {'categ_id': master_id}])
                
            # Delete duplicate
            try:
                odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'unlink', [[dup_id]])
                logger.info(f"Deleted duplicate {dup_id}")
            except Exception as e:
                logger.warning(f"Could not delete {dup_id}: {e}")

logger.info("Deduplication complete!")
