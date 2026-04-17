import psycopg2

def list_overloads():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        functions = ['get_products_filtered', 'get_inventory_list', 'add_to_cart_v2']
        
        for func in functions:
            print(f"\n--- Overloads for {func} ---")
            cur.execute("""
                SELECT 
                    n.nspname as schema,
                    p.proname as function_name,
                    pg_get_function_arguments(p.oid) as arguments
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE p.proname = %s
                AND n.nspname = 'public';
            """, (func,))
            rows = cur.fetchall()
            for row in rows:
                print(f"Schema: {row[0]} | Args: {row[2]}")
                
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_overloads()
