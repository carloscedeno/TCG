from typing import List, Dict, Any, Optional
from ..utils.supabase_client import supabase

class MatcherService:
    @staticmethod
    async def match_cards(names: List[str]) -> Dict[str, str]:
        """
        Smart matching for card names using exact match and fallback to trigram similarity.
        Returns a mapping of input name -> printing_id (latest version).
        """
        results = {}
        unmatched = []

        # 1. Try exact matches first for the whole batch
        # We need to handle this carefully to avoid N+1
        name_filter = "(" + ",".join([f'"{n}"' for n in names]) + ")"
        
        try:
            # We want to get the latest printing_id for each card
            # This is complex in a single query from the cards table, so we join
            resp = supabase.table('cards').select(
                'card_name, card_printings(printing_id, sets(release_date))'
            ).filter('card_name', 'in', name_filter).execute()
            
            found_exact = {}
            for row in resp.data:
                c_name = row['card_name']
                printings = row.get('card_printings') or []
                if printings:
                    # Pick latest release
                    latest = max(printings, key=lambda x: (x.get('sets', {}).get('release_date') or '0000-00-00'))
                    found_exact[c_name.lower()] = latest['printing_id']
            
            for name in names:
                if name.lower() in found_exact:
                    results[name] = found_exact[name.lower()]
                else:
                    unmatched.append(name)
        except Exception as e:
            print(f"Error in exact matching: {e}")
            unmatched = names

        # 2. For unmatched, try fuzzy matching one by one (or in small batches)
        # Using trigram similarity via RPC or raw SQL if possible
        for name in unmatched:
            try:
                # Use similarity operator % via rpc or just a filter if supported
                # Using a raw SQL fallback via execute_sql would be better but we use Client here.
                # Let's try to search using the ilike fallback with wildcards if similarity isn't exposed in PostgREST Client
                # Actually, PostgREST supports fuzzy via custom operators if enabled.
                # For now, let's use a simple ilike and limit for the best candidate.
                
                fuzzy_resp = supabase.table('cards').select(
                    'card_name, card_printings(printing_id, sets(release_date))'
                ).ilike('card_name', f'%{name}%').limit(1).execute()
                
                if fuzzy_resp.data:
                    row = fuzzy_resp.data[0]
                    printings = row.get('card_printings') or []
                    if printings:
                        latest = max(printings, key=lambda x: (x.get('sets', {}).get('release_date') or '0000-00-00'))
                        results[name] = latest['printing_id']
            except Exception as e:
                print(f"Fuzzy match failed for {name}: {e}")

        return results
