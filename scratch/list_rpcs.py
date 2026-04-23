import requests

DEV_URL = "https://bqfkqnnostzaqueujdms.supabase.co"
DEV_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"

def check_triggers():
    headers = {
        "apikey": DEV_KEY,
        "Authorization": f"Bearer {DEV_KEY}",
        "Content-Type": "application/json"
    }
    # We can use the rpc to run a query if we have a generic exec rpc, 
    # but let's try to query the information_schema via standard REST if enabled (usually not).
    # Instead, let's try to query a system table if PostgREST allows it (usually not).
    
    # Let's try to create a function that tells us about triggers.
    sql = """
    CREATE OR REPLACE FUNCTION public.check_triggers(t_name text)
    RETURNS TABLE(trigger_name text, action_statement text) 
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT tgname::text, pg_get_triggerdef(oid)::text
        FROM pg_trigger
        WHERE tgrelid = t_name::regclass;
    END;
    $$;
    """
    # Since I can't run arbitrary SQL easily without an RPC, I'll assume the user has to do it.
    # BUT, I can try to find if there's any 'sync' or 'inventory' related RPCs.
    
    r = requests.get(f"{DEV_URL}/rest/v1/", headers=headers)
    spec = r.json()
    rpcs = [path for path in spec.get('paths', {}).keys() if path.startswith('/rpc/')]
    print("Available RPCs:")
    for rpc in rpcs:
        print(f"  {rpc}")

if __name__ == "__main__":
    check_triggers()
