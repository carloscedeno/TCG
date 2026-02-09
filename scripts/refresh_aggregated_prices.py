import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api.utils.supabase_client import get_supabase_admin

async def refresh_aggregated_prices():
    admin_client = get_supabase_admin()
    
async def refresh_aggregated_prices():
    admin_client = get_supabase_admin()
    
    print("Fetching sources...")
    sources_resp = admin_client.table('sources').select('source_id, source_code').execute()
    if not sources_resp.data:
        print("No sources found.")
        return

    source_map = {s['source_id']: s['source_code'].lower() for s in sources_resp.data}
    target_ids = [sid for sid, code in source_map.items() if code in ('geekorium', 'cardkingdom')]
    target_ids.append(1) # Add legacy source ID
    
    if not target_ids:
        print("Geekorium or CardKingdom source not found.")
        return
        
    print(f"Target Source IDs: {target_ids}")

    print("Fetching relevant price history...")
    # Fetch latest prices for target sources where price > 0
    # We can't do complex grouping in client easily for large datasets without timeout
    # So we fetch decent chunk
    resp = admin_client.table('price_history').select('*')\
        .in_('source_id', target_ids)\
        .gt('price_usd', 0)\
        .order('price_entry_id', desc=True)\
        .limit(2000)\
        .execute()
        
    history = resp.data
    
    if not history:
        print("No relevant price history found.")
        return
        
    print(f"Fetched {len(history)} price entries.")
    
    grouped = {}
    for h in history:
        pid = h['printing_id']
        if pid not in grouped:
            grouped[pid] = []
        grouped[pid].append(h)
        
    upserts = []
    
    for pid, entries in grouped.items():
        geek_price = 0.0
        ck_price = 0.0
        
        for entry in entries:
            sid = entry['source_id']
            code = source_map.get(sid, "")
            price = float(entry['price_usd'] or 0)
            
            if code == 'geekorium' and not geek_price:
                geek_price = price
            elif (code == 'cardkingdom' or sid == 1) and not ck_price:
                ck_price = price
                
            if geek_price and ck_price:
                break
                
        avg_price = 0.0
        if geek_price and ck_price:
            avg_price = (geek_price + ck_price) / 2
        else:
            avg_price = geek_price or ck_price
            
        if avg_price > 0:
            upserts.append({
                'printing_id': pid,
                'condition_id': 16, # Assume NM for aggregated market prices
                'avg_market_price_usd': avg_price
            })
            
    if upserts:
        print(f"Upserting {len(upserts)} aggregated prices...")
        for i in range(0, len(upserts), 100):
            batch = upserts[i:i+100]
            try:
                admin_client.table('aggregated_prices').upsert(batch).execute()
                print(f"Batch {i//100 + 1} done.")
            except Exception as e:
                print(f"Batch {i//100 + 1} error: {e}")
                
        print("Aggregated prices refreshed.")
    else:
        print("No prices to update.")

if __name__ == "__main__":
    asyncio.run(refresh_aggregated_prices())
