import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MergeCats")

odoo = OdooClient()
if not odoo.uid:
    logger.error("Failed to connect to Odoo")
    sys.exit(1)

# Mapping from 'Juegos TCG' child to 'TCG' child
merge_map = {
    9: 87,  # Magic: The Gathering
    6: 87,  # MTG
    25: 81, # Digimon
    17: 83, # Flesh and Blood
    23: 84, # Gundam Card Game
    19: 88, # One Piece TCG
    27: 92, # Pokemon
    21: 93, # Riftbound
    31: 95, # Wixoss
    29: 96, # Yu-Gi-Oh!
}

# Categories to simply move to 'TCG' (74)
move_to_tcg = [11, 15, 13, 33, 35] # Lorcana, DBS, Star Wars, Otros, Otros Singles

tcg_parent = 74
juegos_tcg_parent = 5

for old_id, new_id in merge_map.items():
    logger.info(f"Merging category {old_id} into {new_id}")
    # Move children
    children = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'search', [[('parent_id', '=', old_id)]])
    if children:
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'write', [children, {'parent_id': new_id}])
    
    # Move products
    products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search', [[('categ_id', '=', old_id)]])
    if products:
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [products, {'categ_id': new_id}])
        
    # Delete old category
    try:
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'unlink', [[old_id]])
    except Exception as e:
        logger.warning(f"Could not delete {old_id}: {e}")

for cat_id in move_to_tcg:
    logger.info(f"Moving category {cat_id} to TCG (74)")
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'write', [[cat_id], {'parent_id': tcg_parent}])

# Finally, move any remaining children of Juegos TCG (just in case) and delete it
rem_children = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'search', [[('parent_id', '=', juegos_tcg_parent)]])
if rem_children:
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'write', [rem_children, {'parent_id': tcg_parent}])

rem_prods = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search', [[('categ_id', '=', juegos_tcg_parent)]])
if rem_prods:
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [rem_prods, {'categ_id': tcg_parent}])

try:
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'unlink', [[juegos_tcg_parent]])
    logger.info("Deleted 'Juegos TCG' parent category successfully.")
except Exception as e:
    logger.warning(f"Could not delete 'Juegos TCG': {e}")
    
logger.info("Done!")
