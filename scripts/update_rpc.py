import sys
from pathlib import Path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from sync.common.db import get_db_connection

def update_rpc():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # We update the RPC to use POKEMON instead of PKM
        sql = """
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
    price_max numeric DEFAULT NULL::numeric,
    p_only_new boolean DEFAULT false
)
 RETURNS TABLE(id uuid, name text, game text, set_code text, set_name text, price numeric, image_url text, rarity text, stock integer, printing_id uuid, finish text, condition text, updated_at timestamp with time zone, release_date date, type_line text, colors text[])
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_sort_by TEXT := LOWER(COALESCE(sort_by, 'newest'));
  v_game_code TEXT;
BEGIN
  -- Standardize game codes for filtration
  IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN 
    v_game_code := 'MTG';
  ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' OR game_filter = 'POKEMON' THEN 
    v_game_code := 'PKM'; -- Standardized to PKM as per Ley 15
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
    p.set_name,
    p.price_usd as price,
    p.image_url,
    p.rarity,
    p.stock,
    p.printing_id,
    p.finish,
    p.condition,
    p.updated_at,
    p.release_date,
    p.type_line,
    p.colors
  FROM public.products p
  WHERE
    (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.set_name ILIKE '%' || search_query || '%')
    AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
    AND (set_filter IS NULL OR p.set_code = ANY(set_filter) OR p.set_name = ANY(set_filter))
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    AND (type_filter IS NULL OR p.type_line = ANY(type_filter))
    AND (color_filter IS NULL OR p.colors && color_filter)
    AND (year_from IS NULL OR EXTRACT(YEAR FROM p.release_date) >= year_from)
    AND (year_to IS NULL OR EXTRACT(YEAR FROM p.release_date) <= year_to)
    AND (price_min IS NULL OR p.price_usd >= price_min)
    AND (price_max IS NULL OR p.price_usd <= price_max)
    AND (NOT p_only_new OR (UPPER(p.set_code) IN ('SOS', 'SOA', 'SOC', 'TSOS')))
  ORDER BY
    CASE 
        WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
        WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
        ELSE 2 END ASC,
    CASE WHEN v_sort_by = 'newest' THEN p.updated_at END DESC,
    CASE WHEN v_sort_by = 'price_asc' THEN p.price_usd END ASC,
    CASE WHEN v_sort_by = 'price_desc' THEN p.price_usd END DESC,
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
        conn.commit()
        print("RPC get_products_filtered updated successfully to use POKEMON.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    update_rpc()
