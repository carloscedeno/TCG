import os
import psycopg2

try:
    conn = psycopg2.connect(
        user=os.getenv("DB_USER_PROD"),
        password=os.getenv("DB_PASSWORD"),
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    cur = conn.cursor()
    
    # List of old signatures to drop for create_order_atomic
    drops = [
        "DROP FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb)",
        "DROP FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb, uuid)"
    ]
    
    for d in drops:
        try:
            print(f"Executing: {d}")
            cur.execute(d)
        except Exception as e:
            print(f"Failed to drop: {e}")
            conn.rollback()
            continue
    
    conn.commit()
    print("Cleaned up create_order_atomic overloads")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
