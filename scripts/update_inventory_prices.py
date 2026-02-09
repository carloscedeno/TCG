import asyncio
import os
import sys
from typing import List, Dict, Any

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin
from src.api.services.valuation_service import ValuationService

async def update_zero_prices():
    admin_client = get_supabase_admin()
    
    print("Fetching products with price 0...")
    # Fetch products with price 0
    # We limit to 1000 to avoid timeouts, can be run multiple times
    response = admin_client.table('products').select('id, printing_id, price').eq('price', 0).limit(1000).execute()
    products = response.data
    
    if not products:
        print("No products with 0 price found.")
        return

    print(f"Found {len(products)} products with 0 price. Fetching valuations...")
    
    printing_ids = list(set([p['printing_id'] for p in products]))
    
    # Get valuations
    valuations = await ValuationService.get_batch_valuations(printing_ids)
    
    updates = []
    
    for product in products:
        pid = product['printing_id']
        if pid in valuations:
            val = valuations[pid]
            # Prioritize market price (CardKingdom) as requested
            new_price = val.get('market_price', 0)
            
            # If no market price, try avg
            if new_price == 0:
                new_price = val.get('valuation_avg', 0)
                
            if new_price > 0:
                updates.append({
                    'id': product['id'],
                    'price': new_price,
                    'updated_at': 'now()'
                })
    
    if updates:
        print(f"Updating {len(updates)} products with new prices...")
        # Individual updates to avoid Missing Field errors in UPSERT for partial data
        success_count = 0
        for item in updates:
            try:
                admin_client.table('products').update({
                    'price': item['price'],
                    'updated_at': item['updated_at']
                }).eq('id', item['id']).execute()
                success_count += 1
            except Exception as e:
                print(f"Error updating product {item['id']}: {e}")
                
        print(f"Update complete. Success: {success_count}/{len(updates)}")
    else:
        print("No prices found for these products.")

if __name__ == "__main__":
    asyncio.run(update_zero_prices())
