import psycopg2

try:
    conn = psycopg2.connect(
        user="postgres.sxuotvogwvmxuvwbsscv",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    cur = conn.cursor()
    
    print("--- Searching for overloads of get_inventory_list ---")
    cur.execute("""
        SELECT pg_get_function_identity_arguments(p.oid), p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_inventory_list' AND n.nspname = 'public';
    """)
    for r in cur.fetchall():
        print(f"Signature: {r[0]} | OID: {r[1]}")

    print("\n--- Searching for overloads of upsert_product_inventory ---")
    cur.execute("""
        SELECT pg_get_function_identity_arguments(p.oid), p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'upsert_product_inventory' AND n.nspname = 'public';
    """)
    for r in cur.fetchall():
        print(f"Signature: {r[0]} | OID: {r[1]}")
        
    print("\n--- Searching for overloads of add_to_cart ---")
    cur.execute("""
        SELECT pg_get_function_identity_arguments(p.oid), p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'add_to_cart' AND n.nspname = 'public';
    """)
    for r in cur.fetchall():
        print(f"Signature: {r[0]} | OID: {r[1]}")

    print("\n--- Searching for overloads of add_to_cart_v2 ---")
    cur.execute("""
        SELECT pg_get_function_identity_arguments(p.oid), p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'add_to_cart_v2' AND n.nspname = 'public';
    """)
    for r in cur.fetchall():
        print(f"Signature: {r[0]} | OID: {r[1]}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
