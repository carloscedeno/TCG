import os
import xmlrpc.client
import logging
from typing import List, Dict
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

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

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(xmlrpc.client.ProtocolError))
    def _execute_write(self, odoo_id, price):
        self.models.execute_kw(self.db, self.uid, self.password,
            'product.product', 'write',
            [[odoo_id], {
                'list_price': float(price) # Ensure float type to avoid incongruence
            }]
        )

    def update_product_prices(self, price_updates: List[Dict]):
        if not self.uid:
            logger.warning("Skipping Odoo sync because client is not authenticated.")
            return

        default_codes = [u['default_code'] for u in price_updates]
        if not default_codes:
            return
            
        try:
            # Search for matching products - we don't retry search as it's less critical and we can just skip if it fails once
            product_ids = self.models.execute_kw(self.db, self.uid, self.password,
                'product.product', 'search_read',
                [[['default_code', 'in', default_codes]]],
                {'fields': ['id', 'default_code']}
            )
            
            code_to_id = { p['default_code']: p['id'] for p in product_ids }
            logger.info(f"Found {len(code_to_id)}/{len(default_codes)} matching products in Odoo.")
            
            updates = 0
            failures = 0
            
            for update in price_updates:
                code = update['default_code']
                if code in code_to_id:
                    try:
                        self._execute_write(code_to_id[code], update['price'])
                        updates += 1
                    except Exception as we:
                        logger.error(f"Failed to write price for {code} in Odoo: {we}")
                        failures += 1
            
            logger.info(f"Odoo sync summary: {updates} success, {failures} failed.")
        except Exception as e:
            logger.error(f"Error searching products in Odoo: {e}")
