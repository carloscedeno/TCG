import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir.parent.parent.parent))

load_dotenv(Path(__file__).parent.parent.parent.parent / "supabase" / ".env.local")

from scripts.sync.common.db import get_supabase
from scripts.sync.common.odoo_client import OdooClient

def remove_pokemon():
    supabase = get_supabase()
    odoo = OdooClient()
    
    print("Fetching non-MTG products from Supabase...")
    res = supabase.table('products').select('id').neq('game', 'MTG').execute()
    non_mtg_ids = [str(item['id']) for item in res.data]
    print(f"Found {len(non_mtg_ids)} non-MTG products in Supabase")
    
    if not non_mtg_ids:
        print("Nothing to delete.")
        return
        
    print("Finding corresponding products in Odoo...")
    odoo_products = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
        'product.product', 'search',
        [[['default_code', 'in', non_mtg_ids]]]
    )
    
    print(f"Found {len(odoo_products)} products to delete in Odoo")
    
    if odoo_products:
        print("Deleting...")
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password,
            'product.product', 'unlink', [odoo_products]
        )
        print("Deleted.")

if __name__ == '__main__':
    remove_pokemon()
