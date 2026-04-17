import psycopg2
import sys

rpc_name = sys.argv[1] if len(sys.argv) > 1 else 'get_products_filtered'

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
        WHERE routine_name = %s AND routine_schema = 'public';
    """, (rpc_name,))
    rows = cur.fetchall()
    if not rows:
        print(f"No definition found for '{rpc_name}'")
    for r in rows:
        print(f"--- {r[0]} ---\n{r[1]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
