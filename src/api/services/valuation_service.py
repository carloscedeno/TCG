from typing import Dict, List, Any
from ..utils.supabase_client import supabase

class ValuationService:
    @staticmethod
    async def get_two_factor_valuation(printing_id: str) -> Dict[str, float]:
        """
        Calculates valuation based on Geekorium (Internal) and CardKingdom (External).
        """
        try:
            # Fetch latest prices for this printing from price_history
            response = supabase.table('price_history').select('price_usd, source, scraped_at')\
                .eq('printing_id', printing_id)\
                .order('scraped_at', ascending=False)\
                .limit(20)\
                .execute()
            
            prices = response.data
            
            geek_price = 0.0
            ck_price = 0.0
            
            for p in prices:
                # Store Value (Geekorium or internal benchmark)
                if not geek_price and (p['source'] == 'geekorium' or p['source'] == 'internal'):
                    geek_price = float(p['price_usd'] or 0)
                
                # Market Value (CardKingdom)
                if not ck_price and p['source'] == 'cardkingdom':
                    ck_price = float(p['price_usd'] or 0)
                
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
                "valuation_avg": (geek_price + ck_price) / 2 if (geek_price and ck_price) else (geek_price or ck_price)
            }
        except Exception:
            return {"store_price": 0.0, "market_price": 0.0, "valuation_avg": 0.0}
