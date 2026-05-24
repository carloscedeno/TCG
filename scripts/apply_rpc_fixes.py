import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.prod')

DATABASE_URL = os.getenv("DATABASE_URL").replace(".co:6543", ".com:6543")

if not DATABASE_URL:
    print("DATABASE_URL is not set.")
    exit(1)

import sys
import io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def apply_fixes():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Updating get_products_filtered...")
        rpc_products = """
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
    sort_by text DEFAULT 'newest'::text,
    p_games text[] DEFAULT NULL::text[],
    p_only_discount boolean DEFAULT false,
    p_only_presale boolean DEFAULT false
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
    updated_at timestamp with time zone,
    original_price numeric,
    discount_percentage numeric
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
    p.updated_at,
    p.original_price,
    p.discount_percentage
  FROM public.products p
  WHERE 
    p.stock > 0
    AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
    AND (
      (v_game_code IS NULL AND p_games IS NULL) 
      OR p.game = v_game_code 
      OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22'))
      OR (p_games IS NOT NULL AND (
        (p.game = ANY(p_games)) OR
        ('OTHERS' = ANY(p_games) AND p.game NOT IN ('MTG', 'PKM', 'YGO', 'OPC', 'DGM', 'GND', 'FAB', 'LOR', 'WXS', 'RFB', 'Magic', 'Pokemon', 'One Piece', 'Digimon'))
      ))
    )
    AND (set_filter IS NULL OR p.set_name = ANY(set_filter))
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    AND (color_filter IS NULL OR p.colors && color_filter)
    AND (NOT p_only_new OR NOT v_has_recent OR LOWER(p.set_code) = ANY(v_strixhaven_sets))
    AND (year_from IS NULL OR EXTRACT(YEAR FROM p.release_date) >= year_from)
    AND (year_to IS NULL OR EXTRACT(YEAR FROM p.release_date) <= year_to)
    AND (price_min IS NULL OR p.price >= price_min)
    AND (price_max IS NULL OR p.price <= price_max)
    AND (type_filter IS NULL OR EXISTS (SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'))
    AND (NOT COALESCE(p_only_discount, false) OR (p.discount_percentage > 0 AND (p.discount_end_date IS NULL OR p.discount_end_date >= CURRENT_DATE)))
    AND (NOT COALESCE(p_only_presale, false) OR p.type_line ILIKE '%Preventa%')
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
        cur.execute(rpc_products)
        print("✅ get_products_filtered updated.")

        print("🛠️  Updating get_accessories_filtered...")
        rpc_accessories = """
CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    search_query text DEFAULT NULL::text,
    category_filter text DEFAULT NULL::text,
    game_filter text DEFAULT NULL::text,
    price_min numeric DEFAULT NULL::numeric,
    price_max numeric DEFAULT NULL::numeric,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    sort_by text DEFAULT 'newest'::text,
    p_only_discount boolean DEFAULT false,
    p_only_presale boolean DEFAULT false,
    p_games text[] DEFAULT NULL::text[]
)
 RETURNS TABLE(
    id uuid,
    name text,
    category text,
    game text,
    price numeric,
    stock integer,
    image_url text,
    updated_at timestamp with time zone,
    original_price numeric,
    discount_percentage numeric
 )
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_sort_by TEXT;
  v_game_code TEXT;
BEGIN
  v_sort_by := LOWER(TRIM(COALESCE(sort_by, 'newest')));
  IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN v_game_code := 'MTG';
  ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' THEN v_game_code := 'POKEMON';
  ELSE v_game_code := game_filter; END IF;

  RETURN QUERY
  SELECT 
    a.id, a.name::text, a.category::text, a.game::text, a.price as price,
    a.stock, a.image_url::text, a.updated_at,
    a.original_price, a.discount_percentage
  FROM public.products a
  WHERE 
    a.stock > 0
    AND a.type_line ILIKE '%Accessory%'
    AND (search_query IS NULL OR a.name ILIKE '%' || search_query || '%')
    AND (category_filter IS NULL OR a.category = category_filter)
    AND (
      (v_game_code IS NULL AND p_games IS NULL) 
      OR a.game = v_game_code 
      OR (v_game_code = 'MTG' AND a.game IN ('Magic', '22'))
      OR (p_games IS NOT NULL AND (
        (a.game = ANY(p_games)) OR
        ('OTHERS' = ANY(p_games) AND a.game NOT IN ('MTG', 'PKM', 'YGO', 'OPC', 'DGM', 'GND', 'FAB', 'LOR', 'WXS', 'RFB', 'Magic', 'Pokemon', 'One Piece', 'Digimon'))
      ))
    )
    AND (price_min IS NULL OR a.price >= price_min)
    AND (price_max IS NULL OR a.price <= price_max)
    AND (NOT COALESCE(p_only_discount, false) OR (a.discount_percentage > 0 AND (a.discount_end_date IS NULL OR a.discount_end_date >= CURRENT_DATE)))
    AND (NOT COALESCE(p_only_presale, false) OR a.type_line ILIKE '%Preventa%')
  ORDER BY
    CASE 
        WHEN search_query IS NOT NULL AND a.name ILIKE search_query THEN 0 
        WHEN search_query IS NOT NULL AND a.name ILIKE search_query || '%' THEN 1
        ELSE 2 END ASC,
    CASE WHEN v_sort_by = 'newest' THEN a.updated_at END DESC,
    CASE WHEN v_sort_by = 'price_asc' THEN a.price END ASC,
    CASE WHEN v_sort_by = 'price_desc' THEN a.price END DESC,
    CASE WHEN v_sort_by = 'name' THEN a.name END ASC,
    CASE WHEN v_sort_by = 'name_desc' THEN a.name END DESC,
    a.updated_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;
"""
        cur.execute(rpc_accessories)
        print("get_accessories_filtered updated.")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Successfully applied fixes!")
    except Exception as e:
        print(f"Error applying fixes: {e}")

if __name__ == "__main__":
    apply_fixes()
