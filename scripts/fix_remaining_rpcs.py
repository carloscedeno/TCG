import psycopg2
import sys
import io

# Forzar UTF-8 en la salida de consola para evitar errores en Windows con emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def fix_all_rpcs():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("🛠️  Iniciando limpieza de RPCs en producción...")
        
        # 1. Obtener overloads de get_products_filtered para eliminarlos uno a uno
        cur.execute("""
            SELECT oidvectortypes(proargtypes) 
            FROM pg_proc 
            WHERE proname = 'get_products_filtered' 
            AND pronamespace = 'public'::regnamespace;
        """)
        overloads = cur.fetchall()
        for ov in overloads:
            print(f"🗑️  Goteando overload: get_products_filtered({ov[0]})")
            cur.execute(f"DROP FUNCTION IF EXISTS public.get_products_filtered({ov[0]})")
            
        # 2. Re-crear get_products_filtered con la lógica de Strixhaven
        print("📦 Re-creando get_products_filtered...")
        strixhaven_logic = """
CREATE OR REPLACE FUNCTION public.get_products_filtered(
    search_query text DEFAULT NULL::text,
    game_filter text DEFAULT NULL::text,
    set_filter text[] DEFAULT NULL::text[],
    rarity_filter text[] DEFAULT NULL::text[],
    type_filter text[] DEFAULT NULL::text[],
    color_filter text[] DEFAULT NULL::text[],
    year_from integer DEFAULT NULL::integer,
    year_to integer DEFAULT NULL::integer,
    price_min numeric DEFAULT NULL::numeric,
    price_max numeric DEFAULT NULL::numeric,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    p_only_new boolean DEFAULT false,
    sort_by text DEFAULT 'newest'::text
)
 RETURNS TABLE(
    id uuid,
    name text,
    game text,
    set_code text,
    price numeric,
    image_url text,
    rarity text,
    printing_id uuid,
    stock integer,
    set_name text,
    finish text,
    updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 STABLE
AS $function$
            DECLARE
              v_game_code TEXT;
              v_sort_by TEXT;
              v_has_recent BOOLEAN;
              v_strixhaven_sets TEXT[] := ARRAY['sos', 'soa', 'soc', 'tsos'];
            BEGIN
              v_sort_by := LOWER(TRIM(COALESCE(sort_by, 'newest')));
              IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN v_game_code := 'MTG';
              ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' THEN v_game_code := 'POKEMON';
              ELSE v_game_code := game_filter; END IF;

              IF p_only_new THEN
                  SELECT EXISTS (
                      SELECT 1 FROM public.products p
                      WHERE p.stock > 0
                        AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
                        AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
                        AND LOWER(p.set_code) = ANY(v_strixhaven_sets)
                  ) INTO v_has_recent;
              ELSE
                  v_has_recent := FALSE;
              END IF;

              RETURN QUERY
              SELECT 
                p.id, p.name::text, p.game::text, p.set_code::text, p.price as price,
                p.image_url::text, p.rarity::text, p.printing_id, p.stock, p.set_name::text,
                LOWER(COALESCE(p.finish, 'nonfoil')) as finish,
                p.updated_at
              FROM public.products p
              WHERE 
                p.stock > 0
                AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
                AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
                AND (set_filter IS NULL OR p.set_name = ANY(set_filter))
                AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
                AND (color_filter IS NULL OR p.colors && color_filter)
                AND (NOT p_only_new OR NOT v_has_recent OR LOWER(p.set_code) = ANY(v_strixhaven_sets))
                AND (year_from IS NULL OR EXTRACT(YEAR FROM p.release_date) >= year_from)
                AND (year_to IS NULL OR EXTRACT(YEAR FROM p.release_date) <= year_to)
                AND (price_min IS NULL OR p.price >= price_min)
                AND (price_max IS NULL OR p.price <= price_max)
                AND (type_filter IS NULL OR EXISTS (SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'))
              ORDER BY
                CASE 
                    WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
                    WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
                    ELSE 2 END ASC,
                CASE WHEN v_sort_by = 'newest' THEN p.updated_at END DESC,
                CASE WHEN v_sort_by = 'price_asc' THEN p.price END ASC,
                CASE WHEN v_sort_by = 'price_desc' THEN p.price END DESC,
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
        cur.execute(strixhaven_logic)
        
        # 3. Eliminar overloads de get_inventory_list
        cur.execute("""
            SELECT oidvectortypes(proargtypes) 
            FROM pg_proc 
            WHERE proname = 'get_inventory_list' 
            AND pronamespace = 'public'::regnamespace;
        """)
        overloads_inv = cur.fetchall()
        for ov in overloads_inv:
            print(f"🗑️  Goteando overload: get_inventory_list({ov[0]})")
            cur.execute(f"DROP FUNCTION IF EXISTS public.get_inventory_list({ov[0]})")
            
        # 4. Re-crear get_inventory_list con lógica de Strixhaven
        print("📦 Re-creando get_inventory_list...")
        strixhaven_logic_inv = """
CREATE OR REPLACE FUNCTION public.get_inventory_list(
    p_page integer,
    p_page_size integer,
    p_search text DEFAULT NULL::text,
    p_game text DEFAULT NULL::text,
    p_condition text DEFAULT NULL::text,
    p_sort_by text DEFAULT 'name'::text,
    p_sort_order text DEFAULT 'asc'::text,
    p_only_new boolean DEFAULT false,
    p_set_code text DEFAULT NULL::text
)
 RETURNS TABLE(
    product_id uuid,
    printing_id text,
    name text,
    game text,
    set_code text,
    condition text,
    finish text,
    price numeric,
    stock integer,
    image_url text,
    rarity text,
    updated_at timestamp with time zone,
    total_count bigint
 )
 LANGUAGE plpgsql
 STABLE
AS $function$
    DECLARE
        v_offset INTEGER := p_page * p_page_size;
        v_has_recent BOOLEAN;
        v_strixhaven_sets TEXT[] := ARRAY['sos', 'soa', 'soc', 'tsos'];
    BEGIN
        IF p_only_new THEN
            SELECT EXISTS (
                SELECT 1 FROM public.products p
                WHERE (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
                  AND (p_game IS NULL OR p.game = p_game)
                  AND (p_condition IS NULL OR p.condition = p_condition)
                  AND (p_set_code IS NULL OR p.set_code = p_set_code)
                  AND LOWER(p.set_code) = ANY(v_strixhaven_sets)
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
              AND (NOT p_only_new OR NOT v_has_recent OR LOWER(p.set_code) = ANY(v_strixhaven_sets))
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
$function$;
"""
        cur.execute(strixhaven_logic_inv)
        
        conn.commit()
        print("✨ ¡Producción restaurada con éxito!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error restaurando producción: {e}")

if __name__ == "__main__":
    fix_all_rpcs()
