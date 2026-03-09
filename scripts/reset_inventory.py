import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

def reset_inventory_stock():
    """
    Sets all products' stock to 0 in the public.products table.
    This preserves the records (and order history) while clearing available inventory.
    """
    admin_client = get_supabase_admin()
    
    print("🧹 Resetting all product stock to 0...")
    
    try:
        # Note: Depending on the volume, a single update might be heavy.
        # But for 'products' table, a bulk update is usually fine in Postgres/Supabase.
        # We target all rows by not providing an .eq() filter if we want everything,
        # but Supabase Python client might require a filter or specialized RPC.
        
        # Check total count first
        count_res = admin_client.table('products').select('count', count='exact').execute()
        total_count = count_res.count or 0
        
        if total_count == 0:
            print("ℹ️ No products to reset.")
            return

        print(f"🔄 Updating {total_count} products...")
        
        # Using a range filter or similar if it requires one, 
        # but usually .neq('id', '00000000-0000-0000-0000-000000000000') is a safe 'all' filter.
        res = admin_client.table('products').update({'stock': 0}).neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        print(f"✅ Reset completed. {len(res.data)} products updated to 0 stock.")
        return True

    except Exception as e:
        print(f"❌ Error resetting inventory: {e}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Reset all product stock to 0.')
    parser.add_argument('--force', action='store_true', help='Skip confirmation prompt')
    args = parser.parse_args()
    
    if args.force:
        reset_inventory_stock()
    else:
        confirm = input("⚠️ WARNING: This will set ALL product stock to 0. Continue? (y/n): ")
        if confirm.lower() == 'y':
            reset_inventory_stock()
        else:
            print("❌ Reset cancelled.")
