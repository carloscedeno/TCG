import os
import psycopg2
from dotenv import load_dotenv

def update_rpc():
    load_dotenv('e:/TCG Web App/.env')
    db_url = f"postgresql://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('dbname')}"

    sql = """
CREATE OR REPLACE FUNCTION get_inventory_list(
    p_page INTEGER,
    p_page_size INTEGER,
    p_search TEXT DEFAULT NULL,
    p_game TEXT DEFAULT NULL,
    p_condition TEXT DEFAULT NULL,
    p_set_code TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'name',
    p_sort_order TEXT DEFAULT 'asc',
    p_only_new BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    product_id UUID,
    printing_id TEXT,
    name TEXT,
    game TEXT,
    set_code TEXT,
    condition TEXT,
    price NUMERIC,
    stock INTEGER,
    image_url TEXT,
    rarity TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER := p_page * p_page_size;
    v_has_recent BOOLEAN;
BEGIN
    -- Check if there are ANY recent items in the last 12 days matching the other filters
    IF p_only_new THEN
        SELECT EXISTS (
            SELECT 1 FROM public.products p
            WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
              AND (p_game IS NULL OR p.game = p_game)
              AND (p_condition IS NULL OR p.condition = p_condition)
              AND (p_set_code IS NULL OR p.set_code = p_set_code)
              AND p.created_at >= NOW() - INTERVAL '12 days'
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
            p.price,
            p.stock,
            p.image_url,
            p.rarity,
            p.created_at
        FROM public.products p
        WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
          AND (p_game IS NULL OR p.game = p_game)
          AND (p_condition IS NULL OR p.condition = p_condition)
          AND (p_set_code IS NULL OR p.set_code = p_set_code)
          -- Apply 12-day filter ONLY if p_only_new is true AND we confirmed there are recent items
          AND (NOT p_only_new OR NOT v_has_recent OR p.created_at >= NOW() - INTERVAL '12 days')
    ),
    total_c AS (
        SELECT COUNT(*) as full_count FROM filtered_inventory
    )
    SELECT 
        fi.product_id,
        fi.printing_id,
        fi.name,
        fi.game,
        fi.set_code,
        fi.condition,
        fi.price,
        fi.stock,
        fi.image_url,
        fi.rarity,
        fi.created_at,
        tc.full_count
    FROM filtered_inventory fi
    CROSS JOIN total_c tc
    ORDER BY 
        -- Priority for Newest if p_only_new is true or sort is 'newest'
        CASE WHEN p_only_new OR p_sort_by = 'newest' THEN fi.created_at END DESC,
        -- Other sorts
        CASE WHEN NOT p_only_new AND p_sort_by = 'name' AND p_sort_order = 'asc' THEN fi.name END ASC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'name' AND p_sort_order = 'desc' THEN fi.name END DESC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'price' AND p_sort_order = 'asc' THEN fi.price END ASC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'price' AND p_sort_order = 'desc' THEN fi.price END DESC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'stock' AND p_sort_order = 'asc' THEN fi.stock END ASC,
        CASE WHEN NOT p_only_new AND p_sort_by = 'stock' AND p_sort_order = 'desc' THEN fi.stock END DESC,
        fi.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;
    """

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute(sql)
            conn.commit()
            print("RPC 'get_inventory_list' updated successfully.")
        conn.close()
    except Exception as e:
        print(f"Error updating RPC: {e}")

if __name__ == "__main__":
    update_rpc()
