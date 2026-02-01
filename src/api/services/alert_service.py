from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException
from ..utils.supabase_client import supabase

class AlertService:
    @staticmethod
    async def create_alert(user_id: str, printing_id: str, target_price: float, alert_type: str) -> Dict[str, Any]:
        try:
            res = supabase.table('price_alerts').insert({
                'user_id': user_id,
                'printing_id': printing_id,
                'target_price': target_price,
                'alert_type': alert_type
            }).execute()
            return res.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_user_alerts(user_id: str) -> List[Dict[str, Any]]:
        res = supabase.table('price_alerts').select(
            '*, card_printings(printing_id, image_url, cards(card_name))'
        ).eq('user_id', user_id).execute()
        return res.data or []

    @staticmethod
    async def process_all_alerts() -> Dict[str, Any]:
        """
        Scans all active alerts and compares them with current prices.
        This would be called during the nightly sync.
        """
        alerts = supabase.table('price_alerts').select('*').eq('is_active', True).execute()
        if not alerts.data:
            return {"processed": 0, "triggered": 0}

        triggered_count = 0
        # For efficiency, we should batch fetch prices, but for MVP we do it simply
        for alert in alerts.data:
            # Get current avg market price
            price_res = supabase.table('aggregated_prices').select('avg_market_price_usd').eq('printing_id', alert['printing_id']).execute()
            if not price_res.data:
                continue
            
            current_price = price_res.data[0]['avg_market_price_usd']
            if not current_price: continue

            is_triggered = False
            if alert['alert_type'] == 'below' and current_price <= alert['target_price']:
                is_triggered = True
            elif alert['alert_type'] == 'above' and current_price >= alert['target_price']:
                is_triggered = True

            if is_triggered:
                triggered_count += 1
                # Mark as triggered and notify (notifications would be another service, for now we log)
                supabase.table('price_alerts').update({
                    'last_triggered_at': datetime.now().isoformat(),
                    'is_active': False # Deactivate after trigger for single-use alerts
                }).eq('id', alert['id']).execute()
                
                print(f"ALERT TRIGGERED for User {alert['user_id']}: Printing {alert['printing_id']} reached {current_price}")

        return {"processed": len(alerts.data), "triggered": triggered_count}
