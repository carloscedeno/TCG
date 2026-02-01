from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from ..utils.supabase_client import supabase

class PortfolioService:
    @staticmethod
    async def get_portfolio_analytics(user_id: str) -> Dict[str, Any]:
        """Calculates performance metrics using manual join for robustness."""
        # 1. Fetch collection
        col_res = supabase.table('user_collections').select('quantity, printing_id').eq('user_id', user_id).execute()
        if not col_res.data:
            return {"total_market_value": 0, "total_store_value": 0, "gainers": [], "losers": []}

        printing_ids = [item['printing_id'] for item in col_res.data]
        qty_map = {item['printing_id']: item['quantity'] for item in col_res.data}

        # 2. Fetch prices (Market & Store)
        # Market Prices
        market_res = supabase.table('aggregated_prices').select('printing_id, avg_market_price_usd').in_('printing_id', printing_ids).execute()
        market_map = {m['printing_id']: m['avg_market_price_usd'] or 0 for m in market_res.data}

        # Store Prices
        store_res = supabase.table('products').select('printing_id, price').in_('printing_id', printing_ids).execute()
        store_map = {s['printing_id']: s['price'] or 0 for s in store_res.data}

        total_market = 0
        total_store = 0
        perf_data = []

        for p_id in printing_ids:
            qty = qty_map[p_id]
            m_price = market_map.get(p_id, 0)
            s_price = store_map.get(p_id, 0)

            total_market += m_price * qty
            total_store += s_price * qty

            perf_data.append({
                "printing_id": p_id,
                "current_price": m_price,
                "store_price": s_price
            })

        return {
            "total_market_value": round(total_market, 2),
            "total_store_value": round(total_store, 2),
            "global_valuation_avg": round((total_market + total_store) / 2, 2) if (total_market + total_store) > 0 else 0,
            "gainers": sorted([p for p in perf_data if p['current_price'] > 0], key=lambda x: x['current_price'], reverse=True)[:5],
            "losers": sorted([p for p in perf_data if p['current_price'] > 0], key=lambda x: x['current_price'])[:5]
        }
