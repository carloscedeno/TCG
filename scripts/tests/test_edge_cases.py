import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent.parent / "supabase" / ".env.local")
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent / "sync"))

from common.odoo_client import OdooClient

logger = logging.getLogger("Test_Edge_Cases")

def run_tests():
    logger.info("--- Testing Remaining Edge Cases ---")
    
    # 1. Test Downtime / Timeout simulation
    logger.info("Test 4: Simulating Odoo Downtime (Fake URL)")
    # Backup original URL
    original_url = os.environ.get("ODOO_URL")
    
    # Set fake URL
    os.environ["ODOO_URL"] = "https://this-url-definitely-does-not-exist-12345.com"
    fake_client = OdooClient()
    if not fake_client.uid:
        logger.info("\u2705 Test 4 Passed: Client gracefully rejected connection to unreachable host without breaking.")
    else:
        logger.error("\u274c Test 4 Failed: Client somehow connected to fake host!")
        
    # Restore URL
    os.environ["ODOO_URL"] = original_url
    
    # 2. Test Duplicate SKUs
    logger.info("\nTest 5: Handling Duplicate default_code (SKUs)")
    real_client = OdooClient()
    if not real_client.uid:
        logger.error("Failed to authenticate to real Odoo.")
        return
        
    duplicate_code = "TEST_DUPLICATE_999"
    
    # Create two products with the exact same default_code in Odoo
    logger.info(f"Creating two identical products in Odoo with code: {duplicate_code}")
    id1 = real_client.models.execute_kw(real_client.db, real_client.uid, real_client.password,
        'product.product', 'create',
        [{
            'name': 'Duplicate Test 1',
            'default_code': duplicate_code,
            'list_price': 10.0
        }]
    )
    
    id2 = real_client.models.execute_kw(real_client.db, real_client.uid, real_client.password,
        'product.product', 'create',
        [{
            'name': 'Duplicate Test 2',
            'default_code': duplicate_code,
            'list_price': 10.0
        }]
    )
    
    logger.info(f"Created duplicate products with IDs: {id1}, {id2}")
    
    # Now run our sync method and see how it behaves
    logger.info(f"Attempting to sync price for {duplicate_code} to 42.0")
    real_client.update_product_prices([{'default_code': duplicate_code, 'price': 42.0}])
    
    # Check what happened
    products = real_client.models.execute_kw(real_client.db, real_client.uid, real_client.password,
        'product.product', 'search_read',
        [[['default_code', '=', duplicate_code]]],
        {'fields': ['id', 'list_price']}
    )
    
    updated_ids = [p['id'] for p in products if p['list_price'] == 42.0]
    not_updated_ids = [p['id'] for p in products if p['list_price'] != 42.0]
    
    if len(updated_ids) == 1 and len(not_updated_ids) == 1:
         logger.info("\u2705 Test 5 Passed: As predicted, it silently mapped the code to only ONE of the IDs and updated it, ignoring the clone.")
    else:
         logger.info(f"Test 5 Result: Updated {len(updated_ids)} products, left {len(not_updated_ids)} untouched.")
         
    # Cleanup
    logger.info("Cleaning up duplicate test products...")
    # Odoo execute_kw unlink
    real_client.models.execute_kw(real_client.db, real_client.uid, real_client.password,
        'product.product', 'unlink',
        [[id1, id2]]
    )
    logger.info("Cleanup successful.")
    
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
    run_tests()
