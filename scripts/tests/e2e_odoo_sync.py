import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load variables
load_dotenv(Path(__file__).parent.parent.parent.parent / "supabase" / ".env.local")

# Add common directory to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent / "sync"))

from common.db import get_supabase, setup_logging
from common.odoo_client import OdooClient

logger = setup_logging("E2E_Odoo_Sync")

def run_e2e_test():
    logger.info("--- Starting E2E Odoo Price Sync Test ---")
    supabase = get_supabase()
    odoo = OdooClient()
    
    if not odoo.uid:
        logger.error("Odoo authentication failed. Cannot proceed with E2E.")
        return
        
    # 1. Pick a card that we know exists in Odoo.
    logger.info("Fetching a test product from Odoo...")
    try:
        odoo_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[['default_code', '!=', False]]],
            {'fields': ['id', 'default_code', 'list_price'], 'limit': 1}
        )
        if not odoo_products:
            logger.error("No products found in Odoo.")
            return
            
        test_product = odoo_products[0]
        test_code = test_product['default_code']
        original_odoo_price = test_product['list_price']
        
        logger.info(f"Selected Odoo Product: {test_code} with list_price: {original_odoo_price}")
        
    except Exception as e:
        logger.error(f"Failed to fetch test product from Odoo: {e}")
        return
        
    # 2. Fetch it from Supabase
    try:
        res = supabase.table('products').select('price').eq('id', test_code).maybe_single().execute()
        if not res.data:
            logger.error(f"Product {test_code} not found in Supabase.")
            return
            
        original_db_price = res.data['price'] or 0
        logger.info(f"Supabase Product Price: {original_db_price}")
    except Exception as e:
        logger.error(f"Failed to fetch test product from Supabase: {e}")
        return
        
    # 3. Simulate CK Sync Update
    new_price = float(original_db_price) + 1.25
    logger.info(f"Simulating price update to: {new_price}")
    
    # 4. Trigger Odoo Sync manually for this card
    logger.info("Triggering OdooClient.update_product_prices...")
    odoo.update_product_prices([{"default_code": test_code, "price": new_price}])
    
    # 5. Verify the update in Odoo
    logger.info("Verifying update in Odoo...")
    try:
        updated_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'search_read',
            [[['default_code', '=', test_code]]],
            {'fields': ['id', 'list_price']}
        )
        if not updated_products:
            logger.error("Product disappeared from Odoo!")
        else:
            updated_price = updated_products[0]['list_price']
            logger.info(f"Odoo updated list_price: {updated_price}")
            
            if abs(float(updated_price) - float(new_price)) < 0.01:
                logger.info("✅ E2E TEST PASSED: Price successfully propagated to Odoo.")
            else:
                logger.error(f"❌ E2E TEST FAILED: Expected {new_price}, got {updated_price}")
    except Exception as e:
        logger.error(f"Failed to verify update in Odoo: {e}")
        
    # 6. Restore original price
    logger.info("Restoring original price...")
    odoo.update_product_prices([{"default_code": test_code, "price": original_odoo_price}])
    logger.info("Cleanup complete.")

if __name__ == "__main__":
    run_e2e_test()
