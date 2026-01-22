import csv
import os
import sys
import argparse
from typing import List, Dict, Any
from src.api.utils.supabase_client import get_supabase_admin

def import_manabox_csv(file_path: str, game: str = 'MTG'):
    """
    Imports a Manabox CSV export into the public.products table.
    """
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        return

    admin_client = get_supabase_admin()
    
    products_to_upsert = []
    
    print(f"📖 Reading Manabox CSV: {file_path}...")
    
    try:
        with open(file_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Manabox standard headers (sometimes they vary slightly)
            # We map them to our needs
            for row in reader:
                name = row.get('Name') or row.get('name')
                set_code = row.get('Set code') or row.get('set_code')
                quantity = int(row.get('Quantity') or row.get('quantity') or 1)
                rarity = row.get('Rarity') or row.get('rarity')
                
                if not name:
                    continue

                # ⚠️ Intelligence: Lookup image if not provided (usually Manabox doesn't have image URLs)
                print(f"🔍 Searching image for: {name} ({set_code or 'Unknown Set'})...")
                
                image_url = None
                market_price = 0
                printing_id = None
                
                try:
                    # Query existing card_printings to get a matching image and price
                    # Try exact match with set_code first
                    query = admin_client.table('card_printings').select(
                        'printing_id, image_url, cards!inner(card_name), sets!inner(set_code), aggregated_prices(avg_market_price_usd)'
                    ).eq('cards.card_name', name)
                    
                    if set_code:
                        query = query.eq('sets.set_code', set_code.lower())
                    
                    res = query.limit(1).execute()
                    
                    # Fallback: Just name
                    if not res.data:
                         res = admin_client.table('card_printings').select(
                            'printing_id, image_url, cards!inner(card_name), aggregated_prices(avg_market_price_usd)'
                        ).eq('cards.card_name', name).limit(1).execute()

                    if res.data:
                        match = res.data[0]
                        printing_id = match.get('printing_id')
                        image_url = match.get('image_url')
                        prices = match.get('aggregated_prices') or []
                        # Prices can be a list or a single item depending on how many condition records there are
                        if isinstance(prices, list) and prices:
                            market_price = prices[0].get('avg_market_price_usd') or 0
                        elif isinstance(prices, dict):
                            market_price = prices.get('avg_market_price_usd') or 0
                except Exception as e:
                    print(f"  ⚠️ Lookup failed for {name}: {e}")

                products_to_upsert.append({
                    "name": name,
                    "game": game,
                    "set_code": set_code,
                    "stock": quantity,
                    "price": market_price,
                    "image_url": image_url,
                    "rarity": rarity,
                    "printing_id": printing_id
                })

        if not products_to_upsert:
            print("⚠️ No valid products found in CSV.")
            return

        print(f"🚀 Upserting {len(products_to_upsert)} products to 'products' table...")
        
        # Batch upsert (Supabase handles concurrency/conflicts if we have a unique constraint)
        # For now, we manually check for duplicates in the list to avoid multiple rows for same card
        consolidated = {}
        for p in products_to_upsert:
            key = (p['name'], p['set_code'])
            if key in consolidated:
                consolidated[key]['stock'] += p['stock']
            else:
                consolidated[key] = p
        
        final_list = list(consolidated.values())
        
        # Perform the actual upsert
        # We assume 'name' and 'set_code' as a unique identifier for simplification in this step
        # Note: In production, we'd use a unique constraint in Postgres and use on_conflict
        for item in final_list:
             # Check if exists to update or insert
             check = admin_client.table('products').select('id, stock').eq('name', item['name']).eq('set_code', item['set_code']).execute()
             if check.data:
                 row_id = check.data[0]['id']
                 new_stock = check.data[0]['stock'] + item['stock']
                 admin_client.table('products').update({'stock': new_stock, 'price': item['price'], 'printing_id': item.get('printing_id')}).eq('id', row_id).execute()
                 print(f"  ✅ Updated: {item['name']} (New Stock: {new_stock})")
             else:
                 admin_client.table('products').insert(item).execute()
                 print(f"  ✅ Inserted: {item['name']}")

        print("🎉 Import completed successfully!")

    except Exception as e:
        print(f"❌ Critical Error during import: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import Manabox CSV to Emporio Inventory')
    parser.add_argument('file', help='Path to the CSV file')
    parser.add_argument('--game', default='MTG', help='Game category (MTG, PKM, YGO)')
    
    args = parser.parse_args()
    import_manabox_csv(args.file, args.game)
