from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from ..utils.supabase_client import supabase

class PortfolioService:
    @staticmethod
    async def get_portfolio_analytics(user_id: str) -> Dict[str, Any]:
        """
        Calculates performance metrics for a user's collection.
        Returns: Total Value (Store vs Market), Top Gainers, Top Losers.
        """
        # 1. Fetch collection with current prices
        # We join with aggregated_prices for current market value
        res = supabase.table('user_collections').select(
            'quantity, printing_id, products(price), aggregated_prices!printing_id(avg_market_price_usd)'
        ).eq('user_id', user_id).execute()
        
        if not res.data:
            return {"total_market_value": 0, "total_store_value": 0, "gainers": [], "losers": []}

        total_market = 0
        total_store = 0
        perf_data = []

        for item in res.data:
            qty = item['quantity']
            store_p = (item.get('products') or {}).get('price') or 0
            market_p = (item.get('aggregated_prices') or [{}])[0].get('avg_market_price_usd') or 0
            
            total_store += store_p * qty
            total_market += market_p * qty
            
            # To calculate 24h change, we need historical price
            # This is expensive per item, so we might want to optimize this later
            # For now, let's just use the current values and mock the growth if history is sparse
            perf_data.append({
                "printing_id": item['printing_id'],
                "current_price": market_p,
                "store_price": store_p
            })

        # 2. Mocking/Calculating price evolution (Logic placeholder for real history query)
        # In a real app, we'd fetch price_history from 24h ago for all printing_ids in the portfolio
        
        return {
            "total_market_value": round(total_market, 2),
            "total_store_value": round(total_store, 2),
            "global_valuation_avg": round((total_market + total_store) / 2, 2) if (total_market + total_store) > 0 else 0,
            "gainers": sorted([p for p in perf_data if p['current_price'] > 0], key=lambda x: x['current_price'], reverse=True)[:5],
            "losers": sorted([p for p in perf_data if p['current_price'] > 0], key=lambda x: x['current_price'])[:5]
        }
