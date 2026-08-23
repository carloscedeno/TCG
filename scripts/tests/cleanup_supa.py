import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

supabase = get_supabase()
odoo = OdooClient()

print("Fetching all products from Odoo...")
products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [[]], {'fields': ['id']})
odoo_ids = {str(p['id']) for p in products}

print(f"Total products in Odoo: {len(odoo_ids)}")

print("Fetching all accessories from Supabase...")
accessories = supabase.table('accessories').select('id, odoo_id').execute().data

deleted_count = 0
for acc in accessories:
    if acc.get('odoo_id') and str(acc['odoo_id']) not in odoo_ids:
        # Accessory was deleted in Odoo, delete it from Supabase
        supabase.table('accessories').delete().eq('id', acc['id']).execute()
        deleted_count += 1
        
print(f"Cleanup complete. Deleted {deleted_count} obsolete accessories from Supabase.")
