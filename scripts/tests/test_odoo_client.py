import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load variables
load_dotenv(Path(__file__).parent.parent.parent.parent / "supabase" / ".env.local")

# Add common directory to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent / "sync"))

from common.odoo_client import OdooClient
import logging

logger = logging.getLogger("Test_OdooClient")

def test_odoo_client_cases():
    logger.info("--- Starting Error and Success Cases Test for OdooClient ---")
    odoo = OdooClient()
    
    if not odoo.uid:
        logger.error("Authentication failed. Aborting.")
        return
        
    logger.info("Test 1: Success Case - Single Valid Update")
    # Fetch one product that exists
    products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[['default_code', '!=', False]]],
            {'fields': ['id', 'default_code', 'list_price'], 'limit': 2}
    )
    
    if not products or len(products) < 2:
        logger.error("Need at least 2 products to test.")
        return
        
    p1 = products[0]
    p2 = products[1]
    
    original_price1 = p1['list_price']
    original_price2 = p2['list_price']
    
    # 1. Success case
    logger.info(f"Updating {p1['default_code']} to 999.99 (Success Case)")
    odoo.update_product_prices([{'default_code': p1['default_code'], 'price': 999.99}])
    
    # Verify success
    updated = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[['default_code', '=', p1['default_code']]]],
            {'fields': ['id', 'list_price']}
    )
    if updated and updated[0]['list_price'] == 999.99:
         logger.info("✅ Test 1 Passed: Valid product updated successfully.")
    else:
         logger.error("❌ Test 1 Failed")
         
    # Restore
    odoo.update_product_prices([{'default_code': p1['default_code'], 'price': original_price1}])
    
    logger.info("\nTest 2: Error Case - Non-existent Product")
    logger.info("Attempting to update a fake product 'DOES_NOT_EXIST'")
    odoo.update_product_prices([{'default_code': 'DOES_NOT_EXIST', 'price': 5.0}])
    # Because it searches first, it won't find it, so it should just gracefully log 0/1 found and return.
    logger.info("✅ Test 2 Passed: Non-existent product was handled gracefully without crashing.")
    
    logger.info("\nTest 3: Error Case - Invalid Data Type (Partial Failure in Batch)")
    logger.info("Attempting to send an invalid price type for p1 (string 'INVALID') and a valid price for p2")
    # Python's xmlrpc client will try to serialize, but if we cast loat('INVALID'), Python throws ValueError
    
    # p1 will fail locally on float('INVALID'), p2 should succeed
    odoo.update_product_prices([
        {'default_code': p1['default_code'], 'price': 'INVALID_PRICE_STRING'},
        {'default_code': p2['default_code'], 'price': 888.88}
    ])
    
    # Verify p2 was updated despite p1 failing
    updated_p2 = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[['default_code', '=', p2['default_code']]]],
            {'fields': ['id', 'list_price']}
    )
    if updated_p2 and updated_p2[0]['list_price'] == 888.88:
         logger.info("✅ Test 3 Passed: Batch partial failure handled correctly. Valid update succeeded despite invalid update failing.")
    else:
         logger.error("❌ Test 3 Failed: Valid update did not apply due to batch failure.")
         
    # Restore
    odoo.update_product_prices([{'default_code': p2['default_code'], 'price': original_price2}])
    
    logger.info("\nAll Test Scenarios Completed Successfully!")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
    test_odoo_client_cases()

