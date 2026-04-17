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
    cur.execute("""
        SELECT routine_definition
        FROM information_schema.routines
        WHERE routine_name = 'add_to_cart_v2' AND routine_schema = 'public';
    """)
    row = cur.fetchone()
    if row:
        with open('scripts/add_to_cart_v2_full.sql', 'w', encoding='utf-8') as f:
            f.write(row[0])
        print("Full definition written to scripts/add_to_cart_v2_full.sql")
    else:
        print("RPC not found")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
