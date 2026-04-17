import csv
import os
import sys
import argparse
from typing import List, Dict, Any

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

def map_condition(raw_cond: str) -> str:
    """Maps Manabox condition to DB condition."""
    mapping = {
        'near_mint': 'NM',
        'lightly_played': 'LP',
        'moderately_played': 'MP',
        'heavily_played': 'HP',
        'damaged': 'DMG'
    }
    return mapping.get(raw_cond.lower(), 'NM')

def map_finish(is_foil: str) -> str:
    """Maps Manabox foil status to DB finish."""
    if not is_foil:
        return 'nonfoil'
    is_foil = is_foil.lower()
    if is_foil == 'foil':
        return 'foil'
    if is_foil == 'etched':
        return 'etched'
    return 'nonfoil'

def import_manabox_csv(file_path: str, game: str = 'MTG'):
    """
    Imports a Manabox CSV export into the public.products table.
    """
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        return

    admin_client = get_supabase_admin()
    
    products_to_process = []
    
    print(f"📖 Reading Manabox CSV: {file_path}...")
    
    try:
        with open(file_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                name = row.get('Name') or row.get('name')
                set_code = row.get('Set code') or row.get('set_code')
                quantity = int(row.get('Quantity') or row.get('quantity') or 1)
                rarity = row.get('Rarity') or row.get('rarity')
                condition = map_condition(row.get('Condition') or '')
                finish = map_finish(row.get('Foil') or '')
                scryfall_id = row.get('Scryfall ID') or row.get('scryfall_id')
                
                if not name:
                    continue

                image_url = None
                market_price = 0
                printing_id = scryfall_id
                
                # Look up metadata (image and price)
                # First try by printing_id if we have it
                try:
                    if printing_id:
                        res = admin_client.table('card_printings').select(
                            'image_url, aggregated_prices(avg_market_price_usd)'
                        ).eq('printing_id', printing_id).limit(1).execute()
                        
                        if res.data:
                            match = res.data[0]
                            image_url = match.get('image_url')
                            prices = match.get('aggregated_prices') or []
                            if isinstance(prices, list) and prices:
                                market_price = prices[0].get('avg_market_price_usd') or 0
                            elif isinstance(prices, dict):
                                market_price = prices.get('avg_market_price_usd') or 0
                    
                    # If we STILL don't have image/price, try name/set search
                    if not image_url:
                        print(f"🔍 Searching metadata for: {name} ({set_code or 'Unknown Set'})...")
                        query = admin_client.table('card_printings').select(
                            'printing_id, image_url, cards!inner(card_name), sets!inner(set_code), aggregated_prices(avg_market_price_usd)'
                        ).eq('cards.card_name', name)
                        
                        if set_code:
                            query = query.eq('sets.set_code', set_code.lower())
                        
                        res = query.limit(1).execute()
                        
                        if not res.data:
                             # Try fuzzy search if exact name/set failed
                             res = admin_client.table('card_printings').select(
                                'printing_id, image_url, cards!inner(card_name), sets!inner(set_code), aggregated_prices(avg_market_price_usd)'
                            ).ilike('cards.card_name', f'%{name}%').limit(1).execute()

                        if res.data:
                            match = res.data[0]
                            if not printing_id:
                                printing_id = match.get('printing_id')
                            image_url = match.get('image_url')
                            prices = match.get('aggregated_prices') or []
                            if isinstance(prices, list) and prices:
                                market_price = prices[0].get('avg_market_price_usd') or 0
                            elif isinstance(prices, dict):
                                market_price = prices.get('avg_market_price_usd') or 0
                        else:
                            print(f"  ❌ No metadata found for: {name} in set {set_code}")                except Exception as e:
                    print(f"  ⚠️ Lookup failed for {name}: {e}")

                products_to_process.append({
                    "name": name,
                    "game": game,
                    "set_code": set_code,
                    "stock": quantity,
                    "price": market_price,
                    "image_url": image_url,
                    "rarity": rarity,
                    "printing_id": printing_id,
                    "condition": condition,
                    "finish": finish
                })

        if not products_to_process:
            print("⚠️ No valid products found in CSV.")
            return

        # Consolidate by unique key: (printing_id, condition, finish)
        consolidated = {}
        for p in products_to_process:
            if not p['printing_id']:
                print(f"  ⚠️ Skipping {p['name']}: No printing_id found.")
                continue
                
            key = (p['printing_id'], p['condition'], p['finish'])
            if key in consolidated:
                consolidated[key]['stock'] += p['stock']
                # Keep the highest price or latest? Let's take the latest/highest
                if p['price'] > consolidated[key]['price']:
                    consolidated[key]['price'] = p['price']
            else:
                consolidated[key] = p
        
        final_list = list(consolidated.values())
        print(f"🚀 Upserting {len(final_list)} unique product variations...")
        
        for item in final_list:
            try:
                # Prepare data for upsert
                upsert_data = {
                    "printing_id": item['printing_id'],
                    "name": item['name'],
                    "game": item['game'],
                    "set_code": item['set_code'],
                    "price": item['price'],
                    "stock": item['stock'],
                    "image_url": item['image_url'],
                    "rarity": item['rarity'],
                    "condition": item['condition'],
                    "finish": item['finish']
                }
                
                admin_client.table('products').upsert(
                    upsert_data, 
                    on_conflict='printing_id,condition,finish'
                ).execute()
                print(f"  ✅ Upserted: {item['name']} ({item['condition']}, {item['finish']}) - Stock: {item['stock']}")
            except Exception as e:
                print(f"  ❌ Error upserting {item['name']}: {e}")

        print("🎉 Import completed successfully!")

    except Exception as e:
        print(f"❌ Critical Error during import: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import Manabox CSV to Emporio Inventory')
    parser.add_argument('file', help='Path to the CSV file')
    parser.add_argument('--game', default='MTG', help='Game category (MTG, POKEMON, etc.)')
    
    args = parser.parse_args()
    import_manabox_csv(args.file, args.game)
