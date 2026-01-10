from typing import Dict, List, Any
from ..utils.supabase_client import supabase

class ValuationService:
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
                
                # Market Value (CardKingdom)
                if not ck_price and source_code == 'cardkingdom':
                    ck_price = float(p['price_usd'] or 0)
                    ck_url = p.get('url')
                
                if geek_price and ck_price:
                    break
            
            # Fallback to aggregated_prices if specific sources not found
            if not geek_price or not ck_price:
                agg = supabase.table('aggregated_prices').select('avg_market_price_usd')\
                    .eq('printing_id', printing_id).execute()
                if agg.data:
                    fallback = float(agg.data[0]['avg_market_price_usd'] or 0)
                    geek_price = geek_price or fallback
                    ck_price = ck_price or fallback

            return {
                "store_price": geek_price,
                "market_price": ck_price,
                "market_url": ck_url,
                "valuation_avg": (geek_price + ck_price) / 2 if (geek_price and ck_price) else (geek_price or ck_price)
            }
        except Exception:
            return {"store_price": 0.0, "market_price": 0.0, "valuation_avg": 0.0}
