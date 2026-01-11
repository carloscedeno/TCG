import os
from supabase import create_client
from dotenv import load_dotenv

from datetime import datetime, timezone

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def fix_prices():
    print("🛠️ Starting Price Repair Tool...")
    
    # 1. Update existing price_history records without condition_id or timestamp
    print("🔍 Checking for price entries that need repair...")
    now = datetime.now(timezone.utc).isoformat()
    
    # Update both condition and timestamp for any record lacking them
    res = supabase.table('price_history').update({
        'condition_id': 16,
        'timestamp': now
    }).is_('timestamp', 'null').execute()
    
    print(f"✅ Repaired {len(res.data) if res.data else 0} records (Condition 16 + Timestamp).")
    
    # 2. Trigger aggregation
    # Since we can't run a complex SQL query easily via the client, 
    # we'll fetch unique printing_ids from price_history and manually sum them if needed,
    # OR we can just rely on the trigger if we update them one by one.
    # But a better way is to do a small update to all price_history to fire the trigger.
    
    print("🔄 Triggering aggregation for all current prices...")
    all_prices = supabase.table('price_history').select('printing_id, condition_id, price_usd').limit(1000).execute().data
    
    if not all_prices:
        print("No prices found to aggregate.")
        return

    # To trigger the trigger 'calculate_aggregated_prices', we need to update the records.
    # But that's slow. Let's try to just insert into aggregated_prices directly for the top 500.
    
    agged = {}
    for p in all_prices:
        key = (p['printing_id'], p.get('condition_id', 16))
        if key not in agged: agged[key] = []
        agged[key].append(p['price_usd'])
    
    to_upsert = []
    for (pid, cid), prices in agged.items():
        avg = sum(prices) / len(prices)
        to_upsert.append({
            'printing_id': pid,
            'condition_id': cid,
            'avg_market_price_usd': avg,
            'last_updated': 'now()'
        })
    
    if to_upsert:
        # Note: 'on_conflict' might not be supported in a direct way here like in JS,
        # so we'll use upsert if available or insert.
        try:
            supabase.table('aggregated_prices').upsert(to_upsert, on_conflict='printing_id,condition_id').execute()
            print(f"✨ Successfully aggregated {len(to_upsert)} unique card printings.")
        except Exception as e:
            print(f"⚠️ Manual upsert failed (likely unique constraint): {e}")
            print("Falling back to trigger-based update...")
            # Updating a single column to itself fires the trigger
            supabase.table('price_history').update({'is_foil': False}).eq('source_id', ck_source_id).limit(200).execute()

if __name__ == "__main__":
    fix_prices()
