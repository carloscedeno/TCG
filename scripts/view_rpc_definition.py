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
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_name = 'add_to_cart_v2' AND routine_schema = 'public';
    """)
    rows = cur.fetchall()
    print("Definition of add_to_cart_v2:")
    for r in rows:
        print(f"--- {r[0]} ---\n{r[1]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
