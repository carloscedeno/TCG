-- Migration: Fix RPC get_products_filtered case-sensitivity and stock visibility
-- Date: 2026-04-27
-- Fixes: 'No Results' for Strixhaven when using 'New' filter and hides out-of-stock items.

DROP FUNCTION IF EXISTS public.get_products_filtered(text,text,text[],text[],text[],text[],integer,integer,numeric,numeric,integer,integer,boolean,text);

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
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_game_code TEXT;
  v_sort_by TEXT := COALESCE(sort_by, 'newest');
BEGIN
  -- Standardize game codes for filtration
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
    p.price,
    p.image_url,
    p.rarity,
    p.printing_id::text,
    p.stock,
    p.set_name,
    p.finish,
    p.updated_at
  FROM public.products p
  WHERE
    p.stock > 0
    AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.set_code ILIKE search_query)
    AND (v_game_code IS NULL OR p.game = v_game_code OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22')))
    AND (set_filter IS NULL OR p.set_code = ANY(set_filter) OR p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter))
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    AND (price_min IS NULL OR p.price >= price_min)
    AND (price_max IS NULL OR p.price <= price_max)
    AND (NOT p_only_new OR (UPPER(p.set_code) IN ('SOS', 'SOA', 'SOC', 'TSOS')))
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
