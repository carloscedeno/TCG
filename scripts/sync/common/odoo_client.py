import os
import xmlrpc.client
import logging
from typing import List, Dict

logger = logging.getLogger("OdooClient")

class OdooClient:
    def __init__(self):
        self.url = os.environ.get("ODOO_URL")
        self.db = os.environ.get("ODOO_DB")
        self.username = os.environ.get("ODOO_USERNAME")
        self.password = os.environ.get("ODOO_API_KEY")  # Usually an API Key or Password
        self.uid = None
        
        if not all([self.url, self.db, self.username, self.password]):
            logger.warning("Odoo credentials missing from environment. Odoo Sync will be disabled.")
        else:
            try:
                common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(self.url))
                self.uid = common.authenticate(self.db, self.username, self.password, {})
                if self.uid:
                    self.models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(self.url))
                    logger.info(f"Authenticated with Odoo (UID: {self.uid})")
                else:
                    logger.error("Failed to authenticate with Odoo (Invalid credentials)")
            except Exception as e:
                logger.error(f"Failed to connect to Odoo XMLRPC: {e}")

    def update_product_prices(self, price_updates: List[Dict]):
        if not self.uid:
            logger.warning("Skipping Odoo sync because client is not authenticated.")
            return

        default_codes = [u['default_code'] for u in price_updates]
        if not default_codes:
            return
            
        try:
            product_ids = self.models.execute_kw(self.db, self.uid, self.password,
                'product.product', 'search_read',
                [[['default_code', 'in', default_codes]]],
                {'fields': ['id', 'default_code']}
            )
            
            code_to_id = { p['default_code']: p['id'] for p in product_ids }
            
            updates = 0
            for update in price_updates:
                code = update['default_code']
                if code in code_to_id:
                    self.models.execute_kw(self.db, self.uid, self.password,
                        'product.product', 'write',
                        [[code_to_id[code]], {
                            'list_price': update['price']
                        }]
                    )
                    updates += 1
            
            logger.info(f"Successfully synced {updates} prices to Odoo.")
        except Exception as e:
            logger.error(f"Error syncing prices to Odoo: {e}")
