from typing import Dict, List, Any
from ..utils.supabase_client import supabase

class ValuationService:
    @staticmethod
    async def get_batch_valuations(printing_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        if not printing_ids:
            return {}

        try:
            # Fetch sources map
            sources_resp = supabase.table('sources').select('source_id, source_code').execute()
            source_map = {s['source_id']: s['source_code'] for s in sources_resp.data} if sources_resp.data else {}

            response = supabase.table('price_history').select(
                'printing_id, price_usd, url, source_id'
            ).in_('printing_id', printing_ids)\
             .eq('condition', 'Near Mint')\
             .order('price_entry_id', desc=True)\
             .limit(len(printing_ids) * 10)\
             .execute()
            
            raw_prices = response.data
            valuations: Dict[str, Dict[str, Any]] = {}
            
            grouped_prices: Dict[str, List[Any]] = {pid: [] for pid in printing_ids}
            for p in raw_prices:
                pid = p['printing_id']
                if pid in grouped_prices:
                    grouped_prices[pid].append(p)
            
            # Fetch aggregated_prices for fallback
            agg_resp = supabase.table('aggregated_prices').select('printing_id, avg_market_price_usd').in_('printing_id', printing_ids).execute()
            agg_map = {a['printing_id']: float(a.get('avg_market_price_usd') or 0) for a in agg_resp.data} if agg_resp.data else {}

            for pid, prices in grouped_prices.items():
                geek_price = 0.0
                ck_price = 0.0
                ck_url = None
                
                for p in prices:
                    sid = p.get('source_id')
                    source_code = source_map.get(sid, "").lower()
                    
                    if not geek_price and source_code == 'geekorium':
                        geek_price = float(p.get('price_usd') or 0)
                    
                    if not ck_price and source_code == 'cardkingdom':
                        ck_price = float(p.get('price_usd') or 0)
                        ck_url = p.get('url')
                    
                    if geek_price and ck_price:
                        break
                
                # Removed fallback to aggregated_prices (Goldfish) as per user requirements
                
                val_avg = geek_price if geek_price > 0 else (ck_price or 0.0)

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
    async def get_two_factor_valuation(printing_id: str) -> Dict[str, Any]:
        try:
            sources_resp = supabase.table('sources').select('source_id, source_code').execute()
            source_map = {s['source_id']: s['source_code'] for s in sources_resp.data} if sources_resp.data else {}

            response = supabase.table('price_history').select('price_usd, url, source_id')\
                .eq('printing_id', printing_id)\
                .eq('condition', 'Near Mint')\
                .order('price_entry_id', desc=True)\
                .limit(20)\
                .execute()
            
            prices = response.data
            
            geek_price = 0.0
            ck_price = 0.0
            ck_url = None
            
            for p in prices:
                sid = p.get('source_id')
                source_code = source_map.get(sid, "").lower() if sid else ""
                
                if not geek_price and source_code == 'geekorium':
                    geek_price = float(p['price_usd'] or 0)
                
                if not ck_price and source_code == 'cardkingdom':
                    ck_price = float(p.get('price_usd') or 0)
                    url = p.get('url')
                    if url and 'cardkingdom.com' in url:
                        ck_url = url
                
                if geek_price and ck_price and ck_url:
                    break
            
            # Removed fallback to aggregated_prices (Goldfish) to ensure purity of Card Kingdom data

            if not ck_url:
                try:
                    info = supabase.table('card_printings').select('card:cards(card_name), set:sets(set_name)')\
                        .eq('printing_id', printing_id).single().execute()
                    
                    if info.data:
                        card_name = info.data.get('card', {}).get('card_name', '')
                        set_name = info.data.get('set', {}).get('set_name', '')
                        
                        if card_name and set_name:
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
                "valuation_avg": geek_price if geek_price > 0 else (ck_price or 0.0)
            }
        except Exception:
            return {"store_price": 0.0, "market_price": 0.0, "valuation_avg": 0.0}
