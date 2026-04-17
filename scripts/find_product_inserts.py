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
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_definition ILIKE '%INSERT INTO public.products%' AND routine_schema = 'public';
    """)
    rows = cur.fetchall()
    print("Routines that insert into public.products:")
    for r in rows:
        print(f" - {r[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
