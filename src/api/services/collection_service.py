from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from ..utils.supabase_client import supabase

class CollectionService:
    @staticmethod
    async def import_data(
        user_id: str,
        data: List[Dict[str, Any]],
        mapping: Dict[str, str],
        import_type: str = 'collection'
    ) -> Dict[str, Any]:
        """
        Processes bulk import of cards for collection or price reference.
        Mapping maps system keys to CSV headers.
        System keys: name, set, condition, quantity, price, tcg
        """
        success_count = 0
        errors = []
        
        # Mapping system keys to DB fields or logic
        # name -> cards.card_name
        # set -> sets.set_name or sets.set_code
        # tcg -> games.game_name or games.game_code
        
        for index, row in enumerate(data):
            try:
                card_name = row.get(mapping.get('name', ''))
                set_val = row.get(mapping.get('set', ''))
                tcg_val = row.get(mapping.get('tcg', ''))
                condition = row.get(mapping.get('condition', ''), 'NM')
                quantity = int(row.get(mapping.get('quantity', '1')) or 1)
                item_price = float(row.get(mapping.get('price', '0')) or 0)
                
                if not card_name:
                    errors.append(f"Row {index + 1}: Mandatory field 'name' is empty or not mapped correctly.")
                    continue

                # Step 1: Find the card printing
                # Search by name and join with games/sets
                query = supabase.table('card_printings').select(
                    'printing_id, cards!inner(card_name, game_id), sets!inner(set_name, set_code)'
                ).ilike('cards.card_name', card_name)
                
                # Apply TCG filter if provided
                if tcg_val:
                    game_map = {'MTG': 22, 'Magic': 22, 'Pokemon': 23, 'PKM': 23, 'Lorcana': 24, 'YGO': 26, 'Yu-Gi-Oh': 26}
                    game_id = game_map.get(tcg_val.upper()) or game_map.get(tcg_val.capitalize())
                    if game_id:
                        query = query.eq('cards.game_id', game_id)
                
                if set_val:
                    query = query.or_(f'sets.set_name.ilike.{set_val},sets.set_code.ilike.{set_val}')
                
                # Execute search
                response = query.execute()
                results = response.data
                
                if not results:
                    errors.append(f"Row {index + 1}: Card '{card_name}' not found in database.")
                    continue
                
                # Pick the best match (for now just the first one)
                match = results[0]
                printing_id = match['printing_id']
                
                if import_type == 'collection':
                    # Add to user_collections
                    # Check if already exists to update quantity
                    existing = supabase.table('user_collections').select('*').match({
                        'user_id': user_id,
                        'printing_id': printing_id,
                        'condition': condition
                    }).execute()
                    
                    if existing.data:
                        new_qty = existing.data[0]['quantity'] + quantity
                        supabase.table('user_collections').update({
                            'quantity': new_qty,
                            'updated_at': 'now()'
                        }).eq('id', existing.data[0]['id']).execute()
                    else:
                        supabase.table('user_collections').insert({
                            'user_id': user_id,
                            'printing_id': printing_id,
                            'quantity': quantity,
                            'condition': condition,
                            'purchase_price': item_price
                        }).execute()
                
                elif import_type == 'prices':
                    # Update benchmark prices (Geekorium Price List)
                    # We might store this in a 'benchmark_prices' or 'price_history' table
                    # Using 'aggregated_prices' for now if it's meant to be the main reference
                    supabase.table('aggregated_prices').upsert({
                        'printing_id': printing_id,
                        'avg_market_price_usd': item_price,
                        'updated_at': 'now()'
                    }).execute()
                
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        return {
            "success": True,
            "imported_count": success_count,
            "errors": errors[:50] # Limit reported errors
        }

    @staticmethod
    async def get_user_collection(user_id: str) -> List[Dict[str, Any]]:
        """Retrieves the full collection for a user with two-factor valuation."""
        from .valuation_service import ValuationService
        
        response = supabase.table('user_collections').select(
            'id, printing_id, quantity, condition, purchase_price, '
            'card_printings(printing_id, image_url, '
            'cards(card_name, rarity, game_id), '
            'sets(set_name, set_code))'
        ).eq('user_id', user_id).execute()
        
        collection_data = response.data
        if not collection_data:
            return []

        # Extract all printing ids to minimize calls
        printing_ids = list(set([item['printing_id'] for item in collection_data]))
        
        # Batch fetch valuations
        valuations_map = await ValuationService.get_batch_valuations(printing_ids)

        collection = []
        for item in collection_data:
            pid = item['printing_id']
            # Enrich item with valuation from batch map
            item['valuation'] = valuations_map.get(pid, {
                "store_price": 0.0,
                "market_price": 0.0,
                "valuation_avg": 0.0
            })
            collection.append(item)
            
        return collection
