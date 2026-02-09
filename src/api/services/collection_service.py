from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from ..utils.supabase_client import  get_supabase_admin

# Initialize admin client for backend operations
supabase_admin = get_supabase_admin()

class CollectionService:
    # Map condition strings/codes to their respective database condition_id
    CONDITION_MAP = {
        'NM': 16, 'Near Mint': 16,
        'LP': 17, 'Lightly Played': 17,
        'MP': 18, 'Moderately Played': 18,
        'HP': 19, 'Heavily Played': 19,
        'DM': 20, 'Damaged': 20
    }
    
    
    # Explicit reverse map to ensure we use short codes for the products table
    CONDITION_ID_TO_TEXT = {
        16: 'NM',
        17: 'LP',
        18: 'MP',
        19: 'HP',
        20: 'DM'
    }

    @staticmethod
    async def import_data(
        user_id: str,
        data: List[Dict[str, Any]],
        mapping: Dict[str, str],
        import_type: str = 'collection'
    ) -> Dict[str, Any]:
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
                'collector_number': row.get(mapping.get('collector_number', '')),
                'tcg': row.get(mapping.get('tcg', '')),
                'condition_id': CollectionService.CONDITION_MAP.get(row.get(mapping.get('condition', ''), 'NM'), 16),
                'quantity': int(row.get(mapping.get('quantity', '1')) or 1),
                'price': float(row.get(mapping.get('price', '0')) or 0)
            })

        if not normalized_rows:
            return {"success": True, "imported_count": 0, "errors": errors[:50]}

        # Step 2: Batch fetch card printings
        unique_names = list(set([r['name'] for r in normalized_rows]))
        
        all_matches = []
        # Step 2a: Fetch Card IDs first to avoid heavy join timeouts
        for i in range(0, len(unique_names), 20):
            name_chunk = unique_names[i:i+20]
            name_filter = "(" + ",".join([f'"{n}"' for n in name_chunk]) + ")"
            try:
                # 1. Fetch card_ids for these names
                cards_resp = supabase_admin.table('cards').select('card_id, card_name, game_id, rarity').filter('card_name', 'in', name_filter).execute()
                if not cards_resp.data:
                    continue
                
                card_ids = [c['card_id'] for c in cards_resp.data]
                card_id_map = {c['card_id']: c for c in cards_resp.data}
                
                # 2. Fetch printings for these card_ids
                p_ids_filter = "(" + ",".join([str(cid) for cid in card_ids]) + ")"
                printings_resp = supabase_admin.table('card_printings').select(
                    'printing_id, card_id, collector_number, image_url, sets!inner(set_name, set_code)'
                ).filter('card_id', 'in', p_ids_filter).execute()
                
                for p in printings_resp.data:
                    card_info = card_id_map.get(p['card_id'], {})
                    all_matches.append({
                        'printing_id': p['printing_id'],
                        'collector_number': p['collector_number'],
                        'cards': {
                            'card_name': card_info.get('card_name'),
                            'game_id': card_info.get('game_id')
                        },
                        'sets': p['sets'],
                        'image_url': p.get('image_url'),
                        'rarity': card_info.get('rarity', 'Common') # Default if missing
                    })
            except Exception as e:
                errors.append(f"Error fetching card printings for batch {i}: {str(e)}")

        # Step 3: Match normalized rows to printing_ids
        printing_lookup = {}
        for m in all_matches:
            c_name = m['cards']['card_name'].lower()
            s_name = (m['sets']['set_name'] or "").lower()
            s_code = (m['sets']['set_code'] or "").lower()
            coll_num = (m.get('collector_number') or "").lower()
            
            # Create varied keys for lookup - prioritize most specific
            if coll_num:
                printing_lookup[f"{c_name}|{s_code}|{coll_num}"] = m['printing_id']
                printing_lookup[f"{c_name}|{s_name}|{coll_num}"] = m['printing_id']
            
            printing_lookup[f"{c_name}|{s_name}"] = m['printing_id']
            printing_lookup[f"{c_name}|{s_code}"] = m['printing_id']
            if c_name not in printing_lookup:
                printing_lookup[c_name] = m['printing_id']

        # Step 4: Prepare items for the specific import type
        failed_indices = []
        unmatched_rows = []
        for r in normalized_rows:
            card_name_l = r['name'].lower()
            set_val_l = (r['set'] or "").lower()
            coll_num_l = (r.get('collector_number') or "").lower()
            
            # Try matching by most specific first
            p_id = None
            if coll_num_l:
                p_id = printing_lookup.get(f"{card_name_l}|{set_val_l}|{coll_num_l}")
            
            if not p_id:
                p_id = printing_lookup.get(f"{card_name_l}|{set_val_l}")
            
            if not p_id:
                p_id = printing_lookup.get(card_name_l)
            
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
                    failed_indices.append(r['row_index'])

        items_to_upsert = []
        # Map p_id and condition to original row indices for error tracking
        item_source_indices = {} 
        
        for r in normalized_rows:
            p_id = r.get('printing_id')
            if not p_id: continue
            
            if import_type == 'collection':
                item = {
                    'user_id': user_id,
                    'printing_id': p_id,
                    'condition_id': r['condition_id'],
                    'quantity': r['quantity'],
                    'purchase_price': r['price']
                }
                items_to_upsert.append(item)
                key = (p_id, r['condition_id'])
                if key not in item_source_indices: item_source_indices[key] = []
                item_source_indices[key].append(r['row_index'])
            elif import_type == 'prices':
                items_to_upsert.append({
                    'printing_id': p_id,
                    'avg_market_price_usd': r['price'],
                    'updated_at': 'now()'
                })
            elif import_type == 'inventory':
                items_to_upsert.append({
                    'printing_id': p_id,
                    'condition_id': r['condition_id'],
                    'quantity': r['quantity'],
                    'purchase_price': r['price']
                })

        # Step 5: Execute Bulk Upsert
        if items_to_upsert:
            if import_type == 'collection':
                p_ids = list(set([str(it['printing_id']) for it in items_to_upsert]))
                p_ids_filter = "(" + ",".join(p_ids) + ")"
                
                existing_resp = supabase_admin.table('user_collections').select('id, printing_id, condition_id, quantity').eq('user_id', user_id).filter('printing_id', 'in', p_ids_filter).execute()
                existing_map = {(ex['printing_id'], ex['condition_id']): ex for ex in existing_resp.data}
                
                final_upsert = []
                # Map final_upsert items back to original indices
                upsert_to_indices = {}

                for it in items_to_upsert:
                    key = (it['printing_id'], it['condition_id'])
                    indices = item_source_indices.get(key, [])
                    
                    if key in existing_map:
                        ex = existing_map[key]
                        updated_existing = False
                        for pos, item in enumerate(final_upsert):
                            if item.get('id') == ex['id']:
                                item['quantity'] += it['quantity']
                                upsert_to_indices[pos].extend(indices)
                                updated_existing = True
                                break
                        
                        if not updated_existing:
                            pos = len(final_upsert)
                            final_upsert.append({
                                'id': ex['id'],
                                'user_id': user_id,
                                'printing_id': it['printing_id'],
                                'condition_id': it['condition_id'],
                                'quantity': ex['quantity'] + it['quantity']
                            })
                            upsert_to_indices[pos] = list(indices)
                    else:
                        found_in_batch = False
                        for pos, item in enumerate(final_upsert):
                            if item.get('id') is None and item.get('printing_id') == it['printing_id'] and item.get('condition_id') == it['condition_id']:
                                item['quantity'] += it['quantity']
                                upsert_to_indices[pos].extend(indices)
                                found_in_batch = True
                                break
                        
                        if not found_in_batch:
                            pos = len(final_upsert)
                            final_upsert.append(it)
                            upsert_to_indices[pos] = list(indices)
                
                for j in range(0, len(final_upsert), 100):
                    chunk = final_upsert[j:j+100]
                    try:
                        supabase_admin.table('user_collections').upsert(chunk).execute()
                        success_count += sum([len(upsert_to_indices.get(k, [])) for k in range(j, min(j+100, len(final_upsert)))])
                    except Exception as e:
                        errors.append(f"Upsert failed for batch {j // 100 + 1}: {str(e)}")
                        # Mark all indices in this chunk as failed
                        for k in range(j, min(j+100, len(final_upsert))):
                            failed_indices.extend(upsert_to_indices.get(k, []))
            
            elif import_type == 'prices':
                for j in range(0, len(items_to_upsert), 100):
                    chunk = items_to_upsert[j:j+100]
                    try:
                        supabase_admin.table('aggregated_prices').upsert(chunk).execute()
                        success_count += len(chunk)
                    except Exception as e:
                        errors.append(f"Price update failed for batch {j // 100 + 1}: {str(e)}")

            elif import_type == 'inventory':
                 # Re-fetch extra details from all_matches to build the product object
                 # We need a quick lookup from printing_id to details
                 details_map = {m['printing_id']: m for m in all_matches}
                 
                 # 1. Aggregate imports by (printing_id, condition)
                 aggregated_inventory = {}
                 
                 for it in items_to_upsert:
                     pid = it['printing_id']
                     cond_text = CollectionService.CONDITION_ID_TO_TEXT.get(it['condition_id'], 'NM')
                     key = (pid, cond_text)
                     
                     if key not in aggregated_inventory:
                         details = details_map.get(pid)
                         if not details: continue
                         aggregated_inventory[key] = {
                             'printing_id': pid,
                             'condition': cond_text,
                             'stock': 0,
                             'price': it['purchase_price'],
                             'name': details['cards']['card_name'],
                             'game': 'Magic', # simplified default or derived from game_id (1=Magic)
                             'set_code': details['sets']['set_code'],
                             'image_url': details.get('image_url') or "",
                             'rarity': details.get('rarity') or "Common",
                             'updated_at': 'now()'
                         }
                     
                     aggregated_inventory[key]['stock'] += it['quantity']
                     # Update price if provided in this row (prefer last non-zero)
                     if it['purchase_price'] > 0:
                         aggregated_inventory[key]['price'] = it['purchase_price']

                 inventory_upsert = list(aggregated_inventory.values())

                 # Auto-pricing logic: If price is 0, try to fetch from Card Kingdom (via ValuationService)
                 zero_price_pids = list(set([item['printing_id'] for item in inventory_upsert if item['price'] == 0]))
                 if zero_price_pids:
                     try:
                         from .valuation_service import ValuationService
                         # Batch fetch valuations efficiently
                         valuations = await ValuationService.get_batch_valuations(zero_price_pids)
                         
                         for item in inventory_upsert:
                             if item['price'] == 0:
                                 pid = item['printing_id']
                                 if pid in valuations:
                                     market_price = valuations[pid].get('market_price', 0)
                                     if market_price > 0:
                                         item['price'] = market_price
                     except Exception as e:
                         errors.append(f"Auto-pricing warning: {str(e)}")
                 
                 # 2. Check existing products to merge stock/price
                 p_ids = list(set([x['printing_id'] for x in inventory_upsert]))
                 if p_ids:
                    p_ids_filter = "(" + ",".join(p_ids) + ")"
                    existing_prods = supabase_admin.table('products').select('id, printing_id, condition, stock, price').filter('printing_id', 'in', p_ids_filter).execute()
                    existing_prod_map = {(ep['printing_id'], ep['condition']): ep for ep in existing_prods.data}
                    
                    for prod in inventory_upsert:
                        key = (prod['printing_id'], prod['condition'])
                        if key in existing_prod_map:
                            # Update existing
                            ex = existing_prod_map[key]
                            prod['id'] = ex['id']
                            prod['stock'] += ex['stock'] # ADD to existing stock
                            
                            # Preserve existing price if import price is 0
                            if prod['price'] == 0 and ex.get('price'):
                                prod['price'] = ex['price']
                    
                    # 3. Batch upsert
                    for j in range(0, len(inventory_upsert), 100):
                        chunk = inventory_upsert[j:j+100]
                        try:
                             supabase_admin.table('products').upsert(chunk).execute()
                             success_count += len(chunk)
                        except Exception as e:
                             errors.append(f"Inventory sync failed for batch {j // 100 + 1}: {str(e)}")

        return {
            "success": True,
            "imported_count": success_count,
            "errors": errors[:50],
            "failed_indices": list(set(failed_indices))
        }

    @staticmethod
    async def get_user_collection(user_id: str) -> List[Dict[str, Any]]:
        """Retrieves the full collection for a user with two-factor valuation."""
        from .valuation_service import ValuationService
        
        response = supabase_admin.table('user_collections').select(
            'id, printing_id, quantity, condition_id, purchase_price, '
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

    @staticmethod
    async def update_item(user_id: str, item_id: str, quantity: int, condition_id: Optional[int] = None) -> Dict[str, Any]:
        """Updates quantity or condition of a specific item in the collection."""
        try:
            update_data = {'quantity': quantity}
            if condition_id is not None:
                update_data['condition_id'] = condition_id
            
            res = supabase_admin.table('user_collections').update(update_data).eq('id', item_id).eq('user_id', user_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Item not found or unauthorized")
            return res.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def remove_item(user_id: str, item_id: str) -> bool:
        """Deletes an item from the collection."""
        try:
            res = supabase_admin.table('user_collections').delete().eq('id', item_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
