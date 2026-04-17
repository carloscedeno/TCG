import psycopg2
import sys
import io

# Forzar UTF-8 en la salida de consola para evitar errores en Windows con emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def update_rpc():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("🚀 Actualizando RPC get_products_filtered...")
        
        # New definition using set_code for 'only_new' logic
        new_definition = """
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

              -- La logica de "Nuevo" ahora se restringe exclusivamente al bloque de Strixhaven
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
                -- Solo aplicar filtro de Strixhaven si only_new esta activo y hay cartas disponibles
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
        cur.execute(new_definition)
        conn.commit()
        print("✅ RPC actualizado correctamente.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    update_rpc()
