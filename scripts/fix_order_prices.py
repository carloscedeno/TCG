import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api.utils.supabase_client import get_supabase_admin, get_supabase_client

def fix_order_prices():
    print("Initializing Supabase client...")
    try:
        # Try admin first, fall back to default
        try:
            supabase = get_supabase_admin()
            print("Using Admin Client")
        except:
            supabase = get_supabase_client()
            print("Using Default Client (RLS may apply)")
    except ValueError as e:
        print(f"Error: {e}")
        print("Please ensure SUPABASE_URL and SUPABASE_KEY/SERVICE_ROLE_KEY are set in .env")
        return

    print("Fetching order items with 0 price...")
    
    # Get order items with 0 price
    # Note: 'products' is joined via foreign key if relationship exists, but python client select might need explicit join syntax or just ID.
    # supabase-py select("*, products(id, printing_id)") works if FK exists.
    res = supabase.table('order_items').select('*, products(id, printing_id)').eq('price_at_purchase', 0).execute()
    items = res.data
    
    if not items:
        print("No items with 0 price found.")
        return

    print(f"Found {len(items)} order items with 0 price.")
    
    order_updates = {} # order_id -> True
    
    for item in items:
        product = item.get('products') or item.get('product')
        if not product:
            # Try fetching product manually if join failed
            prod_id = item.get('product_id')
            if prod_id:
                p_res = supabase.table('products').select('id, printing_id').eq('id', prod_id).single().execute()
                product = p_res.data
        
        if not product:
            print(f"Item {item['id']} has no product linked.")
            continue
            
        printing_id = product.get('printing_id')
        if not printing_id:
            print(f"Product {product['id']} has no printing_id.")
            continue
            
        # 1. Try Market Price
        market_price = 0
        try:
            price_res = supabase.table('aggregated_prices').select('avg_market_price_usd').eq('printing_id', printing_id).execute()
            if price_res.data:
                market_price = price_res.data[0].get('avg_market_price_usd', 0)
        except Exception as e:
            print(f"Error fetching market price: {e}")

        # 2. Fallback to Store Price if Market Price is 0 or null
        if not market_price:
            try:
                prod_res = supabase.table('products').select('price').eq('id', product['id']).single().execute()
                if prod_res.data:
                    market_price = prod_res.data.get('price', 0)
            except Exception as e:
                print(f"Error fetching store price: {e}")
                
        if market_price and market_price > 0:
            print(f"Updating item {item['id']} (Product {printing_id}) price to ${market_price}")
            
            # Update order_item
            try:
                supabase.table('order_items').update({'price_at_purchase': market_price}).eq('id', item['id']).execute()
                # Mark order for recalculation
                order_updates[item['order_id']] = True
            except Exception as e:
                 print(f"Error updating item {item['id']}: {e}")
        else:
            print(f"Could not find valid price for item {item['id']} (Product {printing_id})")

    # Recalculate totals for affected orders
    for order_id in order_updates.keys():
        print(f"Recalculating total for Order {order_id}...")
        
        try:
            # Fetch all items for this order
            items_res = supabase.table('order_items').select('quantity, price_at_purchase').eq('order_id', order_id).execute()
            current_items = items_res.data
            
            new_total = sum(i['quantity'] * float(i['price_at_purchase']) for i in current_items)
            
            print(f"Updating Order {order_id} total to ${new_total:.2f}")
            supabase.table('orders').update({'total_amount': new_total}).eq('id', order_id).execute()
        except Exception as e:
             print(f"Error updating order {order_id}: {e}")
        
    print("Done.")

if __name__ == "__main__":
    fix_order_prices()
