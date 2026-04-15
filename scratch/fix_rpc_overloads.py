import psycopg2

def fix_overloads():
    env_dict = {}
    with open('e:/TCG Web App/.env', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_dict[k] = v
                
    db_url = f"postgresql://{env_dict.get('user')}:{env_dict.get('password')}@{env_dict.get('host')}:{env_dict.get('port')}/{env_dict.get('dbname')}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            # signatures to drop (from previous analysis)
            sigs = [
                "(text, text, text[], text[], text[], text[], integer, integer, text, integer, integer, numeric, numeric)",
                "(text, text, text[], text[], text[], text[], text, integer, integer, integer, integer, numeric, numeric)"
            ]
            for sig in sigs:
                try:
                    cur.execute(f"DROP FUNCTION IF EXISTS public.get_products_filtered{sig};")
                    print(f"Dropped function with signature: {sig}")
                except Exception as e:
                    print(f"Failed to drop {sig}: {e}")
                    conn.rollback() # reset transaction for next attempt
            
            # Recreate the correct one
            create_sql = """
            CREATE OR REPLACE FUNCTION public.get_products_filtered(
              search_query text DEFAULT NULL::text,
              game_filter text DEFAULT NULL::text,
              set_filter text[] DEFAULT NULL::text[],
              rarity_filter text[] DEFAULT NULL::text[],
              type_filter text[] DEFAULT NULL::text[],
              color_filter text[] DEFAULT NULL::text[],
              year_from integer DEFAULT NULL::integer,
              year_to integer DEFAULT NULL::integer,
              sort_by text DEFAULT 'newest'::text,
              limit_count integer DEFAULT 50,
              offset_count integer DEFAULT 0,
              price_min numeric DEFAULT NULL::numeric,
              price_max numeric DEFAULT NULL::numeric
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
              finish text
            )
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $function$
            DECLARE
              v_game_code TEXT;
              v_sort_by TEXT;
            BEGIN
              v_sort_by := LOWER(TRIM(COALESCE(sort_by, 'newest')));
              IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN v_game_code := 'MTG';
              ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' THEN v_game_code := 'POKEMON';
              ELSE v_game_code := game_filter; END IF;

              RETURN QUERY
              SELECT 
                p.id, p.name::text, p.game::text, p.set_code::text, p.price_usd as price,
                p.image_url::text, p.rarity::text, p.printing_id, p.stock, p.set_name::text,
                LOWER(COALESCE(p.finish, 'nonfoil')) as finish
              FROM public.products p
              WHERE 
                p.stock > 0
                AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
                AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
                AND (set_filter IS NULL OR p.set_name = ANY(set_filter))
                AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
                AND (color_filter IS NULL OR p.colors && color_filter)
                AND (year_from IS NULL OR EXTRACT(YEAR FROM p.release_date) >= year_from)
                AND (year_to IS NULL OR EXTRACT(YEAR FROM p.release_date) <= year_to)
                AND (price_min IS NULL OR p.price_usd >= price_min)
                AND (price_max IS NULL OR p.price_usd <= price_max)
                AND (type_filter IS NULL OR EXISTS (SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'))
              ORDER BY
                CASE 
                    WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
                    WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
                    ELSE 2 END ASC,
                CASE WHEN v_sort_by = 'price_asc' THEN p.price_usd END ASC,
                CASE WHEN v_sort_by = 'price_desc' THEN p.price_usd END DESC,
                CASE WHEN v_sort_by = 'name' THEN p.name END ASC,
                CASE WHEN v_sort_by = 'name_desc' THEN p.name END DESC,
                CASE WHEN v_sort_by = 'newest' OR v_sort_by = 'release_date' THEN p.release_date END DESC,
                CASE WHEN v_sort_by = 'release_date_asc' THEN p.release_date END ASC,
                p.created_at DESC
              LIMIT limit_count
              OFFSET offset_count;
            END;
            $function$;
            """
            cur.execute(create_sql)
            
            # Grant access
            cur.execute("GRANT EXECUTE ON FUNCTION public.get_products_filtered TO anon, authenticated, service_role;")
            
            conn.commit()
            print("Successfully fixed overloads and recreated get_products_filtered")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_overloads()
