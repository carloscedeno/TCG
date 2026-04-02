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
            
            # Removed aggregated_prices for fallback
            # CK NM is the single source of truth
            
            for pid, prices in grouped_prices.items():
                ck_price = 0.0
                ck_url = None
                
                for p in prices:
                    sid = p.get('source_id')
                    source_code = source_map.get(sid, "").lower()
                    
                    if not ck_price and source_code == 'cardkingdom':
                        ck_price = float(p.get('price_usd') or 0)
                        ck_url = p.get('url')
                        break
                
                # SMART REPAIR If no CK price found for this specific printing, try ANY CK price for this card name
                if not ck_price:
                    try:
                        # 1. Get the card_id for this printing
                        card_info = supabase.table('card_printings').select('card_id').eq('printing_id', pid).single().execute()
                        if card_info.data:
                            card_id = card_info.data['card_id']
                            # 2. Get the most recent CK price for ANY printing of this card
                            fallback_res = supabase.table('price_history').select('price_usd, url')\
                                .eq('source_id', ck_source_id)\
                                .in_('printing_id', supabase.table('card_printings').select('printing_id').eq('card_id', card_id))\
                                .order('timestamp', desc=True)\
                                .limit(1).execute()
                            
                            if fallback_res.data:
                                ck_price = float(fallback_res.data[0]['price_usd'])
                                ck_url = fallback_res.data[0].get('url')
                    except Exception as e:
                        print(f"Fallback valuation skipped for {pid}: {e}")

                market_price = ck_price
                final_price = ck_price

                valuations[pid] = {
                    "store_price": final_price,
                    "market_price": market_price,
                    "market_url": ck_url,
                    "valuation_avg": market_price
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
                .order('price_entry_id', desc=True)\
                .limit(20)\
                .execute()
            
            prices = response.data
            
            ck_price = 0.0
            ck_url = None
            
            for p in prices:
                sid = p.get('source_id')
                source_code = source_map.get(sid, "").lower() if sid else ""
                
                if not ck_price and source_code == 'cardkingdom':
                    ck_price = float(p.get('price_usd') or 0)
                    url = p.get('url')
                    if url and 'cardkingdom.com' in url:
                        ck_url = url
                        break
            
            # Business rule: CK NM is the single source of truth
            market_price = ck_price
            final_price = ck_price

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
                "store_price": final_price,
                "market_price": market_price,
                "market_url": ck_url,
                "valuation_avg": market_price
            }
        except Exception:
            return {"store_price": 0.0, "market_price": 0.0, "valuation_avg": 0.0}
