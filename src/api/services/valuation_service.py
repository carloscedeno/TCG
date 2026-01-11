from typing import Dict, List, Any
from ..utils.supabase_client import supabase

class ValuationService:
    @staticmethod
    async def get_batch_valuations(printing_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Calculates valuations for a batch of printing_ids to optimize performance.
        Returns a dictionary keyed by printing_id.
        """
        if not printing_ids:
            return {}

        try:
            # 1. Fetch latest prices for all printing_ids
            # We use a custom RPC or just a raw query. 
            # Since Supabase JS/Python client doesn't support "distinct on" securely in simple select for heavy loads,
            # we will fetch recent history and process in memory.
            # Ideally this should be a Postgres View or Function.
            
            response = supabase.table('price_history').select(
                'printing_id, price_usd, url, created_at, source:source_id(source_code)'
            ).in_('printing_id', printing_ids)\
             .order('created_at', ascending=False)\
             .limit(len(printing_ids) * 10)\
             .execute()
            
            raw_prices = response.data
            valuations: Dict[str, Dict[str, Any]] = {}
            
            # Group by printing_id
            grouped_prices: Dict[str, List[Any]] = {pid: [] for pid in printing_ids}
            for p in raw_prices:
                pid = p['printing_id']
                if pid in grouped_prices:
                    grouped_prices[pid].append(p)
            
            for pid, prices in grouped_prices.items():
                geek_price = 0.0
                ck_price = 0.0
                ck_url = None
                
                for p in prices:
                    source_code = p.get('source', {}).get('source_code')
                    
                    if not geek_price and source_code == 'geekorium':
                        geek_price = float(p.get('price_usd') or 0)
                    
                    if not ck_price and source_code == 'cardkingdom':
                        ck_price = float(p.get('price_usd') or 0)
                        ck_url = p.get('url')
                    
                    if geek_price and ck_price:
                        break
                
                # Check for Fallback in aggregated_prices if missing
                # (Batching this fallback is complex without a second query, 
                #  for now we skip fallback or do a second batch query if critical)
                
                # Basic calculation without fallback to avoid N+1 on fallback too
                val_avg = 0.0
                if geek_price and ck_price:
                    val_avg = (geek_price + ck_price) / 2
                else:
                    val_avg = geek_price or ck_price

                valuations[pid] = {
                    "store_price": geek_price,
                    "market_price": ck_price,
                    "market_url": ck_url,
                    "valuation_avg": val_avg
                }
                
            return valuations
            
        except Exception as e:
            print(f"Batch valuation error: {e}")
            return {pid: {"store_price": 0.0, "market_price": 0.0, "valuation_avg": 0.0} for pid in printing_ids}

    @staticmethod
    async def get_two_factor_valuation(printing_id: str) -> Dict[str, float]:
        """
        Calculates valuation based on Geekorium (Internal) and CardKingdom (External).
        """
        try:
            # Fetch latest prices including source metadata
            response = supabase.table('price_history').select('price_usd, url, source:source_id(source_code)')\
                .eq('printing_id', printing_id)\
                .order('created_at', ascending=False)\
                .limit(20)\
                .execute()
            
            prices = response.data
            
            geek_price = 0.0
            ck_price = 0.0
            ck_url = None
            
            for p in prices:
                source_code = p.get('source', {}).get('source_code')
                
                # Store Value (Geekorium)
                if not geek_price and source_code == 'geekorium':
                    geek_price = float(p['price_usd'] or 0)
                
                if not ck_price and source_code == 'cardkingdom':
                    ck_price = float(p.get('price_usd') or 0)
                    # Check if URL looks like CardKingdom
                    url = p.get('url')
                    if url and 'cardkingdom.com' in url:
                        ck_url = url
                    else:
                        # If URL is missing or wrong, we will generate it later
                        pass
                
                if geek_price and ck_price and ck_url:
                    break
            
            # Fallback to aggregated_prices if specific sources not found
            if not geek_price or not ck_price:
                agg = supabase.table('aggregated_prices').select('avg_market_price_usd')\
                    .eq('printing_id', printing_id).execute()
                if agg.data:
                    fallback = float(agg.data[0]['avg_market_price_usd'] or 0)
                    geek_price = geek_price or fallback
                    ck_price = ck_price or fallback

            # Fallback for URL generation if missing (and if we have a price or as a general service)
            if not ck_url:
                try:
                    # Fetch card and set info for URL construction
                    # We need set name and card name. 
                    # Note: This is an approximation. CardKingdom set names might differ from Scryfall/DB.
                    info = supabase.table('card_printings').select('card:cards(card_name), set:sets(set_name)')\
                        .eq('printing_id', printing_id).single().execute()
                    
                    if info.data:
                        card_name = info.data.get('card', {}).get('card_name', '')
                        set_name = info.data.get('set', {}).get('set_name', '')
                        
                        if card_name and set_name:
                            # Simple Slugify: lowercase, replace spaces with hyphens, remove chars
                            def slugify(text):
                                import re
                                text = text.lower()
                                text = re.sub(r'[^a-z0-9\s-]', '', text)
                                return re.sub(r'\s+', '-', text)

                            ck_slug_set = slugify(set_name)
                            ck_slug_card = slugify(card_name)
                            ck_url = f"https://www.cardkingdom.com/mtg/{ck_slug_set}/{ck_slug_card}"
                except Exception as e:
                    print(f"Error generating fallback URL: {e}")

            return {
                "store_price": geek_price,
                "market_price": ck_price,
                "market_url": ck_url,
                "valuation_avg": (geek_price + ck_price) / 2 if (geek_price and ck_price) else (geek_price or ck_price)
            }
        except Exception:
            return {"store_price": 0.0, "market_price": 0.0, "valuation_avg": 0.0}
