import json
import os
import sys
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

def backup_inventory():
    """
    Exports the current content of public.products to a JSON backup file.
    """
    admin_client = get_supabase_admin()
    
    print("📦 Fetching existing inventory from 'products' table...")
    
    try:
        # Fetch all records. Using large pagination if necessary.
        # Products table shouldn't be massive (>100k) but it's good to be cautious.
        all_products = []
        page_size = 1000
        offset = 0
        
        while True:
            res = admin_client.table('products').select('*').range(offset, offset + page_size - 1).execute()
            if not res.data:
                break
            all_products.extend(res.data)
            offset += page_size
            if len(res.data) < page_size:
                break
        
        if not all_products:
            print("⚠️ No products found in database.")
            return
            
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"data/inventory_backup_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(all_products, f, indent=2, default=str)
            
        print(f"✅ Backup created: {filename} ({len(all_products)} records)")
        return filename

    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        return None

if __name__ == "__main__":
    backup_inventory()
