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
    
    # List of old signatures to drop
    drops = [
        "DROP FUNCTION public.get_inventory_list(integer, integer, text, text, text, text, text, text, boolean)",
        "DROP FUNCTION public.upsert_product_inventory(uuid, numeric, integer, text)",
        "DROP FUNCTION public.add_to_cart(text, integer, uuid, text)",
        "DROP FUNCTION public.add_to_cart_v2(text, integer, uuid, text)"
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
    print("Cleaned up overloads")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
