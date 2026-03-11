import os, requests, sys
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

url = os.getenv('SUPABASE_URL') or 'https://sxuotvogwvmxuvwbsscv.supabase.co'
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')

if not key:
    print("ERROR: No service role key found")
    sys.exit(1)

print(f"Using: {url}")

# Read the migration SQL
with open('supabase/migrations/20260311_fix_mv_price_ordering.sql', 'r') as f:
    sql = f.read()

print("Applying migration via REST API...")

# Use the SQL Editor REST endpoint
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# Supabase allows executing SQL via the DB REST API using rpc or through the management API
# Try using the postgres REST endpoint
r = requests.post(
    f"{url}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={'query': sql},
    timeout=60
)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")
