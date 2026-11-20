-- Migration: Unify duplicate card_ids across identical card names and group storefront catalog (get_products_filtered) by card name + game

-- 1. Unify split card_ids on card_printings to canonical card_id (preferring original Scryfall card rows with mana_cost/created_at)
WITH canonical_cards AS (
  SELECT DISTINCT ON (game_id, LOWER(TRIM(card_name)))
    card_id as canonical_id,
    game_id,
    LOWER(TRIM(card_name)) as norm_name
  FROM public.cards
  WHERE card_name IS NOT NULL
  ORDER BY
    game_id,
    LOWER(TRIM(card_name)),
    (CASE WHEN mana_cost IS NOT NULL THEN 0 ELSE 1 END) ASC,
    (CASE WHEN created_at IS NOT NULL THEN 0 ELSE 1 END) ASC,
    card_id ASC
)
UPDATE public.card_printings cp
SET card_id = cc.canonical_id
FROM public.cards c
JOIN canonical_cards cc ON cc.game_id = c.game_id AND cc.norm_name = LOWER(TRIM(c.card_name))
WHERE cp.card_id = c.card_id
  AND cp.card_id <> cc.canonical_id;

-- 2. Group get_products_filtered by (LOWER(TRIM(name)), game) so multiple editions/finishes collapse into a single catalog card with summed stock
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
  p_only_discount boolean DEFAULT false,
  p_only_presale boolean DEFAULT false,
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
  printing_id text,
  stock integer,
  set_name text,
  finish text,
  updated_at timestamp with time zone,
  original_price numeric,
  discount_percentage numeric,
  discount_end_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_game_code TEXT;
  v_sort_by TEXT := COALESCE(sort_by, 'newest');
  v_mapped_colors text[] := NULL;
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

  IF color_filter IS NOT NULL THEN
     v_mapped_colors := ARRAY(
         SELECT CASE 
            WHEN c = 'White' THEN 'W'
            WHEN c = 'Blue' THEN 'U'
            WHEN c = 'Black' THEN 'B'
            WHEN c = 'Red' THEN 'R'
            WHEN c = 'Green' THEN 'G'
            ELSE c
         END FROM unnest(color_filter) c
     );
  END IF;

  RETURN QUERY
  WITH matching_products AS (
    SELECT
      p.id,
      p.name,
      p.game,
      p.set_code,
      CASE WHEN p.discount_percentage > 0 AND (p.discount_end_date IS NULL OR p.discount_end_date > now())
           THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
           ELSE p.price 
      END as eff_price,
      p.image_url,
      p.rarity,
      p.printing_id::text as printing_id_text,
      p.stock,
      p.set_name,
      p.finish,
      p.updated_at,
      p.release_date,
      p.price as orig_price,
      p.discount_percentage,
      p.discount_end_date
    FROM public.products p
    WHERE
      p.stock > 0
      AND (search_query IS NULL OR p.name ILIKE '%' || TRIM(search_query) || '%' OR p.set_code ILIKE TRIM(search_query))
      AND (
        v_game_code IS NULL 
        OR (v_game_code = 'OTHERS' AND COALESCE(p.game, '') NOT IN ('MTG', 'PKM', 'YGO', 'RFB', 'OPC', 'DGM', 'GND', 'FAB', 'Magic', '22', 'Pokemon', 'One Piece', 'Digimon', 'Yu-Gi-Oh', 'Flesh and Blood', 'Riftbound', 'Gundam'))
        OR p.game = v_game_code 
        OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22'))
      )
      AND (set_filter IS NULL OR LOWER(p.set_code) = ANY(SELECT LOWER(s) FROM unnest(set_filter) s) OR p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter))
      AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (NOT p_only_new OR p.updated_at >= NOW() - INTERVAL '14 days')
      AND (NOT p_only_discount OR (p.discount_percentage > 0 AND (p.discount_end_date IS NULL OR p.discount_end_date > now())))
      AND (NOT p_only_presale OR p.name ILIKE '%(preventa)%')
      AND (
        type_filter IS NULL 
        OR EXISTS (
            SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'
        )
      )
      AND (
        color_filter IS NULL 
        OR ('Colorless' = ANY(color_filter) AND (p.colors IS NULL OR array_length(p.colors, 1) IS NULL))
        OR ('Multicolor' = ANY(color_filter) AND array_length(p.colors, 1) > 1)
        OR p.colors && v_mapped_colors
      )
  ),
  grouped_cards AS (
    SELECT DISTINCT ON (LOWER(TRIM(mp.name)), COALESCE(mp.game, 'MTG'))
      mp.id,
      mp.name,
      mp.game,
      mp.set_code,
      mp.eff_price as price,
      mp.image_url,
      mp.rarity,
      mp.printing_id_text as printing_id,
      (SUM(mp.stock) OVER (PARTITION BY LOWER(TRIM(mp.name)), COALESCE(mp.game, 'MTG')))::integer as stock,
      mp.set_name,
      mp.finish,
      (MAX(mp.updated_at) OVER (PARTITION BY LOWER(TRIM(mp.name)), COALESCE(mp.game, 'MTG'))) as updated_at,
      mp.release_date,
      mp.orig_price as original_price,
      mp.discount_percentage,
      mp.discount_end_date
    FROM matching_products mp
    ORDER BY
      LOWER(TRIM(mp.name)),
      COALESCE(mp.game, 'MTG'),
      CASE WHEN v_sort_by = 'price_asc' THEN mp.eff_price END ASC,
      CASE WHEN v_sort_by = 'price_desc' THEN mp.eff_price END DESC,
      CASE WHEN COALESCE(mp.finish, 'nonfoil') = 'nonfoil' THEN 0 ELSE 1 END ASC,
      mp.updated_at DESC,
      mp.id ASC
  )
  SELECT
    gc.id,
    gc.name,
    gc.game,
    gc.set_code,
    gc.price,
    gc.image_url,
    gc.rarity,
    gc.printing_id,
    gc.stock,
    gc.set_name,
    gc.finish,
    gc.updated_at,
    gc.original_price,
    gc.discount_percentage,
    gc.discount_end_date
  FROM grouped_cards gc
  ORDER BY
    CASE 
        WHEN search_query IS NOT NULL AND gc.name ILIKE TRIM(search_query) THEN 0 
        WHEN search_query IS NOT NULL AND gc.name ILIKE TRIM(search_query) || '%' THEN 1
        ELSE 2 END ASC,
    CASE WHEN v_sort_by = 'newest' THEN gc.updated_at END DESC,
    CASE WHEN v_sort_by = 'price_asc' THEN gc.price END ASC,
    CASE WHEN v_sort_by = 'price_desc' THEN gc.price END DESC,
    CASE WHEN v_sort_by = 'name' THEN gc.name END ASC,
    CASE WHEN v_sort_by = 'name_desc' THEN gc.name END DESC,
    CASE WHEN v_sort_by = 'release_date' THEN gc.release_date END DESC NULLS LAST,
    CASE WHEN v_sort_by = 'release_date_asc' THEN gc.release_date END ASC NULLS LAST,
    gc.updated_at DESC,
    gc.name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;
