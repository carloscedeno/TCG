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
    ) -> Dict[Dict[str, Any], Any]:
        """
        Processes bulk import of cards for collection or price reference.
        Optimized to use batch queries and minimize N+1 overhead.
        """
        success_count = 0
        errors = []
        
        if not data:
            return {"success": True, "imported_count": 0, "errors": []}

        # Step 1: Normalize and group data
        normalized_rows = []
        for index, row in enumerate(data):
            card_name = row.get(mapping.get('name', ''))
            if not card_name:
                errors.append(f"Row {index + 1}: Mandatory field 'name' is empty.")
                continue
            
            normalized_rows.append({
                'row_index': index,
                'name': card_name,
                'set': row.get(mapping.get('set', '')),
                'tcg': row.get(mapping.get('tcg', '')),
                'condition': row.get(mapping.get('condition', ''), 'NM'),
                'quantity': int(row.get(mapping.get('quantity', '1')) or 1),
                'price': float(row.get(mapping.get('price', '0')) or 0)
            })

        if not normalized_rows:
            return {"success": True, "imported_count": 0, "errors": errors[:50]}

        # Step 2: Batch fetch card printings
        unique_names = list(set([r['name'] for r in normalized_rows]))
        
        all_matches = []
        # Chunks of 50 names to avoid URI length issues or query limits
        for i in range(0, len(unique_names), 50):
            name_chunk = unique_names[i:i+50]
            # Use 'in' filter with properly formatted PostgreSQL list
            # We use a simple list of quoted strings
            name_filter = "(" + ",".join([f'"{n}"' for n in name_chunk]) + ")"
            try:
                resp = supabase.table('card_printings').select(
                    'printing_id, cards!inner(card_name, game_id), sets!inner(set_name, set_code)'
                ).filter('cards.card_name', 'in', name_filter).execute()
                all_matches.extend(resp.data)
            except Exception as e:
                errors.append(f"Error fetching card printings for batch {i}: {str(e)}")

        # Step 3: Match normalized rows to printing_ids
        printing_lookup = {}
        for m in all_matches:
            c_name = m['cards']['card_name'].lower()
            s_name = (m['sets']['set_name'] or "").lower()
            s_code = (m['sets']['set_code'] or "").lower()
            
            # Create varied keys for lookup
            printing_lookup[f"{c_name}|{s_name}"] = m['printing_id']
            printing_lookup[f"{c_name}|{s_code}"] = m['printing_id']
            if c_name not in printing_lookup:
                printing_lookup[c_name] = m['printing_id']

        # Step 4: Prepare items for the specific import type
        unmatched_rows = []
        for r in normalized_rows:
            card_name_l = r['name'].lower()
            set_val_l = (r['set'] or "").lower()
            lookup_key = f"{card_name_l}|{set_val_l}" if set_val_l else card_name_l
            
            p_id = printing_lookup.get(lookup_key) or printing_lookup.get(card_name_l)
            if not p_id:
                unmatched_rows.append(r)
            else:
                r['printing_id'] = p_id

        # Fallback to smart matching for remaining
        if unmatched_rows:
            from .matcher_service import MatcherService
            names_to_match = list(set([r['name'] for r in unmatched_rows]))
            smart_matches = await MatcherService.match_cards(names_to_match)
            
            for r in unmatched_rows:
                p_id = smart_matches.get(r['name'])
                if p_id:
                    r['printing_id'] = p_id
                else:
                    errors.append(f"Row {r['row_index'] + 1}: Card '{r['name']}' not found in database.")

        items_to_upsert = []
        for r in normalized_rows:
            p_id = r.get('printing_id')
            if not p_id: continue
            
            if import_type == 'collection':
                items_to_upsert.append({
                    'user_id': user_id,
                    'printing_id': p_id,
                    'condition': r['condition'],
                    'quantity': r['quantity'],
                    'purchase_price': r['price']
                })
            elif import_type == 'prices':
                items_to_upsert.append({
                    'printing_id': p_id,
                    'avg_market_price_usd': r['price'],
                    'updated_at': 'now()'
                })

        # Step 5: Execute Bulk Upsert
        if items_to_upsert:
            try:
                if import_type == 'collection':
                    # Extract unique printing IDs to fetch existing
                    p_ids = list(set([str(it['printing_id']) for it in items_to_upsert]))
                    p_ids_filter = "(" + ",".join(p_ids) + ")"
                    
                    existing_resp = supabase.table('user_collections').select('id, printing_id, condition, quantity').eq('user_id', user_id).filter('printing_id', 'in', p_ids_filter).execute()
                    
                    # Track existing to update or insert
                    existing_map = {(ex['printing_id'], ex['condition']): ex for ex in existing_resp.data}
                    
                    final_upsert = []
                    for it in items_to_upsert:
                        key = (it['printing_id'], it['condition'])
                        if key in existing_map:
                            ex = existing_map[key]
                            # Update quantity in the update list
                            # If we already have a record in final_upsert for this key, find and update it
                            updated_existing = False
                            for item in final_upsert:
                                if item.get('id') == ex['id']:
                                    item['quantity'] += it['quantity']
                                    updated_existing = True
                                    break
                            
                            if not updated_existing:
                                final_upsert.append({
                                    'id': ex['id'],
                                    'user_id': user_id,
                                    'printing_id': it['printing_id'],
                                    'condition': it['condition'],
                                    'quantity': ex['quantity'] + it['quantity']
                                })
                        else:
                            # Check if we already added a NEW record for this key in this batch
                            found_in_batch = False
                            for item in final_upsert:
                                if item.get('id') is None and item.get('printing_id') == it['printing_id'] and item.get('condition') == it['condition']:
                                    item['quantity'] += it['quantity']
                                    found_in_batch = True
                                    break
                            
                            if not found_in_batch:
                                final_upsert.append(it)
                    
                    # Split into chunks of 100 for upsert
                    for j in range(0, len(final_upsert), 100):
                        supabase.table('user_collections').upsert(final_upsert[j:j+100]).execute()
                    
                    success_count = len(items_to_upsert)
                
                elif import_type == 'prices':
                    for j in range(0, len(items_to_upsert), 100):
                        supabase.table('aggregated_prices').upsert(items_to_upsert[j:j+100]).execute()
                    success_count = len(items_to_upsert)
                    
            except Exception as e:
                errors.append(f"Bulk operation failed: {str(e)}")

        return {
            "success": True,
            "imported_count": success_count,
            "errors": errors[:50]
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
