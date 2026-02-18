import asyncio
import os
import sys
from src.api.utils.supabase_client import get_supabase_admin

async def refresh_aggregated_prices():
    admin_client = get_supabase_admin()
    
    print("--- Starting Robust Data Refresh ---")
    print("Executing refresh_all_catalog_data RPC...")
    
    try:
        # Call the new RPC that handles bulk aggregation AND materialized view refresh
        resp = admin_client.rpc('refresh_all_catalog_data').execute()
        
        print("Success: Catalog prices aggregated and Materialized View refreshed.")
        print("The Grid and Modal should now show consistent updated prices.")
        
    except Exception as e:
        print(f"Critical error during refresh: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(refresh_aggregated_prices())
