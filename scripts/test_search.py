import psycopg2
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_search():
    try:
        DB_USER = "postgres.sxuotvogwvmxuvwbsscv"
        DB_PASS = "jLta9LqEmpMzCI5r"
        DB_HOST = "aws-0-us-west-2.pooler.supabase.com"
        DB_PORT = "6543"
        DB_NAME = "postgres"
        
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cur = conn.cursor()
        
        # Calling with explicit parameters to avoid ambiguity
        cur.execute("""
            SELECT name, set_code, price 
            FROM public.get_products_filtered(
                'Walking'::text,  -- search_query
                NULL::text,      -- game_code
                NULL::text[],    -- rarities
                NULL::text[],    -- set_codes
                NULL::text[],    -- colors
                NULL::text[],    -- types
                NULL::integer,   -- year_from
                NULL::integer,   -- year_to
                NULL::numeric,   -- price_min
                NULL::numeric,   -- price_max
                5,               -- p_limit
                0,               -- p_offset
                false,           -- p_only_new
                'price_desc'     -- p_sort
            );
        """)
        rows = cur.fetchall()
        print("Search results for 'Walking':")
        for r in rows:
            print(f"Name: {r[0]}, Set: {r[1]}, Price: {r[2]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_search()
