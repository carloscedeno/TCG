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
    CREATE OR REPLACE FUNCTION public.get_inventory_list(p_page integer, p_page_size integer, p_search text DEFAULT NULL::text, p_game text DEFAULT NULL::text, p_condition text DEFAULT NULL::text, p_sort_by text DEFAULT 'name'::text, p_sort_order text DEFAULT 'asc'::text, p_only_new boolean DEFAULT false, p_set_code text DEFAULT NULL::text)
    RETURNS TABLE(product_id uuid, printing_id text, name text, game text, set_code text, condition text, finish text, price numeric, stock integer, image_url text, rarity text, updated_at timestamp with time zone, total_count bigint)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_offset INTEGER := p_page * p_page_size;
        v_has_recent BOOLEAN;
    BEGIN
        IF p_only_new THEN
            SELECT EXISTS (
                SELECT 1 FROM public.products p
                WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
                  AND (p_game IS NULL OR p.game = p_game)
                  AND (p_condition IS NULL OR p.condition = p_condition)
                  AND (p_set_code IS NULL OR p.set_code = p_set_code)
                  AND p.updated_at >= NOW() - INTERVAL '12 days'
            ) INTO v_has_recent;
        ELSE
            v_has_recent := FALSE;
        END IF;

        RETURN QUERY
        WITH filtered_inventory AS (
            SELECT 
                p.id as product_id,
                p.printing_id::text,
                p.name,
                p.game,
                p.set_code,
                p.condition,
                COALESCE(p.finish, 'nonfoil') as finish,
                p.price,
                p.stock,
                p.image_url,
                p.rarity,
                p.updated_at
            FROM public.products p
            WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
              AND (p_game IS NULL OR p.game = p_game)
              AND (p_condition IS NULL OR p.condition = p_condition)
              AND (p_set_code IS NULL OR p.set_code = p_set_code)
              AND (NOT p_only_new OR NOT v_has_recent OR p.updated_at >= NOW() - INTERVAL '12 days')
        ),
        total_c AS (
            SELECT COUNT(*) as full_count FROM filtered_inventory
        )
        SELECT 
            fi.product_id, fi.printing_id, fi.name, fi.game, fi.set_code, 
            fi.condition, fi.finish, fi.price, fi.stock, fi.image_url, fi.rarity, 
            fi.updated_at, tc.full_count
        FROM filtered_inventory fi
        CROSS JOIN total_c tc
        ORDER BY 
            CASE WHEN p_sort_by = 'newest' THEN fi.updated_at END DESC,
            CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN fi.name END ASC,
            CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN fi.name END DESC,
            CASE WHEN p_sort_by = 'price' AND p_sort_order = 'asc' THEN fi.price END ASC,
            CASE WHEN p_sort_by = 'price' AND p_sort_order = 'desc' THEN fi.price END DESC,
            CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'asc' THEN fi.stock END ASC,
            CASE WHEN p_sort_by = 'stock' AND p_sort_order = 'desc' THEN fi.stock END DESC,
            fi.updated_at DESC
        LIMIT p_page_size
        OFFSET v_offset;
    END;
    $$;
    """)
    conn.commit()
    print("Successfully updated get_inventory_list RPC")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
