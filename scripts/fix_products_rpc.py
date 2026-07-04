import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.prod')
DATABASE_URL = os.getenv("DATABASE_URL").replace(".co:6543", ".com:6543")

def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    sql = """
    CREATE OR REPLACE FUNCTION public.get_products_filtered(
        search_query text DEFAULT NULL,
        game_filter text DEFAULT NULL,
        set_filter text[] DEFAULT NULL,
        rarity_filter text[] DEFAULT NULL,
        type_filter text[] DEFAULT NULL,
        color_filter text[] DEFAULT NULL,
        year_from integer DEFAULT NULL,
        year_to integer DEFAULT NULL,
        price_min numeric DEFAULT NULL,
        price_max numeric DEFAULT NULL,
        limit_count integer DEFAULT 50,
        offset_count integer DEFAULT 0,
        p_only_new boolean DEFAULT false,
        p_only_discount boolean DEFAULT false,
        p_only_presale boolean DEFAULT false,
        sort_by text DEFAULT 'newest'
    )
    RETURNS TABLE(
        id uuid,
        name text,
        game text,
        set_code text,
        price numeric,
        image_url text,
        rarity text,
        printing_id text,
        stock integer,
        set_name text,
        finish text,
        updated_at timestamptz,
        original_price numeric,
        discount_percentage numeric,
        discount_end_date timestamptz
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
      v_game_code TEXT;
      v_sort_by TEXT := COALESCE(sort_by, 'newest');
    BEGIN
      IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN 
        v_game_code := 'MTG';
      ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' OR game_filter = 'POKEMON' THEN 
        v_game_code := 'PKM';
      ELSIF game_filter ILIKE 'One%' OR game_filter = 'OPC' OR game_filter = 'ONEPIECE' THEN 
        v_game_code := 'OPC';
      ELSIF game_filter ILIKE 'Digi%' OR game_filter = 'DGM' OR game_filter = 'DIGIMON' THEN 
        v_game_code := 'DGM';
      ELSE 
        v_game_code := game_filter;
      END IF;

      RETURN QUERY
      SELECT
        p.id,
        p.name,
        p.game,
        p.set_code,
        CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
             THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
             ELSE p.price 
        END as price,
        p.image_url,
        p.rarity,
        p.printing_id::text,
        p.stock,
        p.set_name,
        p.finish,
        p.updated_at,
        p.price as original_price,
        p.discount_percentage,
        p.discount_end_date
      FROM public.products p
      WHERE
        p.stock > 0
        AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.set_code ILIKE search_query)
        AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
        AND (set_filter IS NULL OR p.set_code = ANY(set_filter) OR p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter))
        AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
        AND (price_min IS NULL OR (CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() THEN p.price * (1 - p.discount_percentage / 100.0) ELSE p.price END) >= price_min)
        AND (price_max IS NULL OR (CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() THEN p.price * (1 - p.discount_percentage / 100.0) ELSE p.price END) <= price_max)
        AND (NOT p_only_new OR (UPPER(p.set_code) IN ('SOS', 'SOA', 'SOC', 'TSOS')))
        AND (NOT p_only_discount OR (p.discount_percentage > 0 AND p.discount_end_date IS NOT NULL AND p.discount_end_date > now()))
        AND (NOT p_only_presale OR (p.name ILIKE '%(preventa)%' OR p.type_line ILIKE '%Preventa%'))
      ORDER BY
        CASE 
            WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
            WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
            ELSE 2 END ASC,
        CASE WHEN v_sort_by = 'newest' THEN p.updated_at END DESC,
        CASE WHEN v_sort_by = 'price_asc' THEN (CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2) ELSE p.price END) END ASC,
        CASE WHEN v_sort_by = 'price_desc' THEN (CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2) ELSE p.price END) END DESC,
        CASE WHEN v_sort_by = 'name' THEN p.name END ASC,
        CASE WHEN v_sort_by = 'name_desc' THEN p.name END DESC,
        CASE WHEN v_sort_by = 'release_date' THEN p.release_date END DESC,
        CASE WHEN v_sort_by = 'release_date_asc' THEN p.release_date END ASC,
        p.updated_at DESC
      LIMIT limit_count
      OFFSET offset_count;
    END;
    $function$;
    """
    cur.execute(sql)
    print("get_products_filtered fixed.")
    
    cur.execute("NOTIFY pgrst, 'reload schema';")
    print("Schema reloaded.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    run()
