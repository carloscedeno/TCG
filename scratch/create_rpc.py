import psycopg2
import os

# Using the pooler connection string with correct user format
conn_str = "postgresql://postgres.bqfkqnnostzaqueujdms:jLta9LqEmpMzCI5r@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

sql = """
CREATE OR REPLACE FUNCTION public.refresh_mv()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.mv_unique_cards;
END;
$$;

-- Also recreate the search card names just in case
CREATE OR REPLACE FUNCTION public.search_card_names(query_text text, limit_count int DEFAULT 10)
RETURNS TABLE(card_name text) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT mv.card_name::text
    FROM public.mv_unique_cards mv
    WHERE mv.card_name ILIKE '%' || query_text || '%'
    LIMIT limit_count;
END;
$$;

REFRESH MATERIALIZED VIEW public.mv_unique_cards;
"""

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()
    print("Executing SQL...")
    cur.execute(sql)
    print("SQL Executed Successfully.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
