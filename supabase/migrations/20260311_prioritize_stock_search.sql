-- Migration: Prioritize In-Stock Cards in Search
-- Purpose:  Update get_products_filtered to include out-of-stock items for search
--           but prioritize in-stock versions at the top.
-- Date: 2026-03-11

BEGIN;

-- We DROP and RECREATE because we are changing the filtering and sorting logic
DROP FUNCTION IF EXISTS public.get_products_filtered(text, text, text[], text[], text[], text[], text, integer, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.get_products_filtered(
    search_query text DEFAULT NULL::text, 
    game_filter text DEFAULT NULL::text, 
    set_filter text[] DEFAULT NULL::text[], 
    rarity_filter text[] DEFAULT NULL::text[], 
    type_filter text[] DEFAULT NULL::text[], 
    color_filter text[] DEFAULT NULL::text[], 
    sort_by text DEFAULT 'newest'::text, 
    limit_count integer DEFAULT 50, 
    offset_count integer DEFAULT 0, 
    year_from integer DEFAULT NULL::integer, 
    year_to integer DEFAULT NULL::integer
)
RETURNS TABLE (
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
STABLE
AS $function$
DECLARE
  v_game_code TEXT;
  v_sort_by TEXT;
BEGIN
  -- Normalize Inputs
  v_sort_by := LOWER(TRIM(COALESCE(sort_by, 'newest')));
  
  -- Game Mapping
  IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN
    v_game_code := 'MTG';
  ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' THEN
    v_game_code := 'POKEMON';
  ELSE
    v_game_code := game_filter;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name::text,
    p.game::text,
    s.set_code::text,
    -- Prioritize denormalized prices from card_printings based on finish
    COALESCE(
        CASE 
            WHEN LOWER(p.finish) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd
            ELSE cp.avg_market_price_usd 
        END, 
        p.price, 
        0
    ) as price,
    COALESCE(p.image_url, cp.image_url)::text as image_url,
    p.rarity::text,
    p.printing_id,
    p.stock,
    s.set_name::text,
    LOWER(COALESCE(p.finish, 'nonfoil')) as finish
  FROM public.products p
  JOIN public.card_printings cp ON p.printing_id = cp.printing_id
  JOIN public.sets s ON cp.set_id = s.set_id
  JOIN public.cards c ON cp.card_id = c.card_id
  WHERE 
    -- THE FIX: Removing "p.stock > 0" to allow out-of-stock items ("Por encargo") to appear in search
    (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
    AND (
         v_game_code IS NULL 
         OR p.game = v_game_code
         OR (v_game_code = 'MTG' AND (p.game = 'Magic' OR p.game = '22'))
    )
    AND (set_filter IS NULL OR s.set_name = ANY(set_filter))
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    AND (
      color_filter IS NULL 
      OR c.colors && color_filter
    )
    AND (year_from IS NULL OR EXTRACT(YEAR FROM s.release_date) >= year_from)
    AND (year_to IS NULL OR EXTRACT(YEAR FROM s.release_date) <= year_to)
  ORDER BY
    -- PRIMARY PRIORITY: Exact match
    CASE WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 ELSE 1 END ASC,
    -- SECONDARY PRIORITY: STOCK (In stock items first)
    CASE WHEN p.stock > 0 THEN 0 ELSE 1 END ASC,
    -- TERTIARY PRIORITY: UI sorting (price, newest, etc.)
    CASE 
        WHEN v_sort_by = 'price_asc' THEN COALESCE(cp.avg_market_price_usd, p.price, 0)
    END ASC,
    CASE 
        WHEN v_sort_by = 'price_desc' THEN COALESCE(cp.avg_market_price_usd, p.price, 0)
    END DESC,
    CASE WHEN v_sort_by = 'newest' THEN p.created_at END DESC,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

COMMIT;
