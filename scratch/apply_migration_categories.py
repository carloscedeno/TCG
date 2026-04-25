#!/usr/bin/env python3
"""
Apply migration via Supabase REST API.
Splits the SQL into individual statements and executes each via a temporary RPC.
"""
import os, sys, requests, json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SERVICE_KEY  = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
ANON_KEY     = os.getenv('SUPABASE_ANON_KEY')

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def rpc(fn, params={}):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/{fn}", headers=headers, json=params)
    return r

def rest_get(table, params="select=*&limit=5"):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=headers)
    return r

# --- Step 1: Check connectivity
print("Testing connectivity...")
r = rest_get("games", "select=game_id,game_name&limit=3")
if r.status_code != 200:
    print(f"FAILED: Cannot reach Supabase REST. Status {r.status_code}: {r.text[:200]}")
    sys.exit(1)

games = r.json()
print(f"OK - Connected. Found {len(games)} games (sample).")
for g in games:
    print(f"   {g}")

# --- Step 2: Check if migration already applied
r2 = rest_get("accessory_categories", "select=code&limit=1")
if r2.status_code == 200:
    print("\nINFO: accessory_categories table ALREADY EXISTS.")
    cats = r2.json()
    print(f"   Found {len(cats)} categories (limited).")
    
    # Show full distribution
    r3 = rest_get("accessories", "select=category_code&limit=1000")
    if r3.status_code == 200:
        accs = r3.json()
        from collections import Counter
        dist = Counter(a.get('category_code','NULL') for a in accs)
        print(f"\n   Accessory distribution ({len(accs)} total):")
        for code, cnt in dist.most_common():
            print(f"      {str(code):25s} -> {cnt}")
    
    # Show all games
    r4 = rest_get("games", "select=game_id,game_name,game_code&order=game_id")
    if r4.status_code == 200:
        print("\n   Games registered:")
        for g in r4.json():
            print(f"      [{g['game_id']}] {str(g['game_name']):30s} ({g.get('game_code','')})")
    sys.exit(0)
else:
    print(f"\nINFO: Table does not exist ({r2.status_code}). Need to apply migration manually.")
    print("\n" + "="*60)
    print("ACTION REQUIRED: Apply the migration manually in Supabase Dashboard.")
    print("="*60)
    print("\n1. Go to: https://supabase.com/dashboard/project/bqfkqnnostzaqueujdms/sql/new")
    print("2. Copy and paste the content of:")
    print("   supabase/migrations/20260425000001_normalize_accessory_categories.sql")
    print("3. Click 'Run'")
    print("\nThe migration file is ready at:")
    print("   e:\\TCG Web App\\supabase\\migrations\\20260425000001_normalize_accessory_categories.sql")
    sys.exit(2)
