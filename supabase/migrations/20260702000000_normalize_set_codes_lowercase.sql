-- Normalizar todos los set_code a minúsculas (formato Scryfall) y fusionar duplicados por case sensitivity

-- 1. Redirigir card_printings de sets en mayúsculas/mixtas a sus equivalentes en minúsculas (si ya existe la versión minúscula)
UPDATE public.card_printings cp
SET set_id = s_lower.set_id
FROM public.sets s_upper
JOIN public.sets s_lower ON LOWER(s_upper.set_code) = LOWER(s_lower.set_code) 
    AND s_upper.set_id != s_lower.set_id 
    AND s_lower.set_code = LOWER(s_lower.set_code)
WHERE cp.set_id = s_upper.set_id
  AND s_upper.set_code != LOWER(s_upper.set_code);

-- 2. Eliminar los sets redundantes que ya fueron redirigidos
DELETE FROM public.sets s_upper
WHERE s_upper.set_code != LOWER(s_upper.set_code)
  AND EXISTS (
    SELECT 1 FROM public.sets s_lower
    WHERE LOWER(s_lower.set_code) = LOWER(s_upper.set_code)
      AND s_lower.set_id != s_upper.set_id
      AND s_lower.set_code = LOWER(s_lower.set_code)
  );

-- 3. Normalizar todas las columnas set_code a minúsculas
UPDATE public.sets SET set_code = LOWER(set_code) WHERE set_code IS NOT NULL AND set_code != LOWER(set_code);
UPDATE public.card_printings SET set_code = LOWER(set_code) WHERE set_code IS NOT NULL AND set_code != LOWER(set_code);
UPDATE public.products SET set_code = LOWER(set_code) WHERE set_code IS NOT NULL AND set_code != LOWER(set_code);
UPDATE public.order_items SET set_code = LOWER(set_code) WHERE set_code IS NOT NULL AND set_code != LOWER(set_code);

-- 4a. Para cart_items: Si el carrito ya tiene el producto keep_id, sumamos la cantidad del producto duplicado y eliminamos la fila del duplicado para evitar conflicto de constraint único
WITH duplicates AS (
    SELECT (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id, ARRAY_AGG(id) as all_ids
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
),
cart_dups AS (
    SELECT ci.id as dup_ci_id, ci.cart_id, ci.quantity, d.keep_id
    FROM public.cart_items ci
    JOIN duplicates d ON ci.product_id = ANY(d.all_ids) AND ci.product_id != d.keep_id
)
UPDATE public.cart_items ci_keep
SET quantity = ci_keep.quantity + cd.quantity
FROM cart_dups cd
WHERE ci_keep.cart_id = cd.cart_id AND ci_keep.product_id = cd.keep_id;

WITH duplicates AS (
    SELECT (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id, ARRAY_AGG(id) as all_ids
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
)
DELETE FROM public.cart_items ci
USING duplicates d
WHERE ci.product_id = ANY(d.all_ids) AND ci.product_id != d.keep_id
  AND EXISTS (SELECT 1 FROM public.cart_items ci2 WHERE ci2.cart_id = ci.cart_id AND ci2.product_id = d.keep_id);

-- 4b. Redirigir el resto de cart_items, order_items y product_offers_history tras resolver colisiones en carritos
WITH duplicates AS (
    SELECT (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id, ARRAY_AGG(id) as all_ids
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
)
UPDATE public.cart_items ci
SET product_id = d.keep_id
FROM duplicates d
WHERE ci.product_id = ANY(d.all_ids) AND ci.product_id != d.keep_id;

WITH duplicates AS (
    SELECT (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id, ARRAY_AGG(id) as all_ids
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
)
UPDATE public.order_items oi
SET product_id = d.keep_id
FROM duplicates d
WHERE oi.product_id = ANY(d.all_ids) AND oi.product_id != d.keep_id;

WITH duplicates AS (
    SELECT (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id, ARRAY_AGG(id) as all_ids
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
)
UPDATE public.product_offers_history poh
SET product_id = d.keep_id
FROM duplicates d
WHERE poh.product_id = ANY(d.all_ids) AND poh.product_id != d.keep_id;

-- 5. Fusionar el stock de los productos duplicados
WITH duplicates AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids,
        SUM(stock) as total_stock
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
)
UPDATE public.products p
SET stock = d.total_stock
FROM duplicates d
WHERE p.id = d.keep_id;

-- 6. Eliminar los registros de productos duplicados secundarios cuyo stock ya fue fusionado
WITH duplicates AS (
    SELECT (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id, ARRAY_AGG(id) as all_ids
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
    GROUP BY LOWER(name), LOWER(set_code), LOWER(condition), LOWER(finish)
    HAVING COUNT(*) > 1
)
DELETE FROM public.products p
USING duplicates d
WHERE p.id = ANY(d.all_ids) AND p.id != d.keep_id;

-- 7. Actualizar la función RPC get_products_filtered para que la comparación por set_code sea insensible a mayúsculas/minúsculas
CREATE OR REPLACE FUNCTION public.get_products_filtered(
  search_query text DEFAULT NULL::text,
  game_filter text[] DEFAULT NULL::text[],
  set_filter text[] DEFAULT NULL::text[],
  rarity_filter text[] DEFAULT NULL::text[],
  price_min numeric DEFAULT NULL::numeric,
  price_max numeric DEFAULT NULL::numeric,
  sort_by text DEFAULT 'release_date'::text,
  sort_order text DEFAULT 'desc'::text,
  page_size integer DEFAULT 20,
  page_number integer DEFAULT 1,
  p_only_new boolean DEFAULT false,
  p_only_discount boolean DEFAULT false,
  p_only_presale boolean DEFAULT false,
  type_filter text[] DEFAULT NULL::text[],
  color_filter text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  id uuid,
  name text,
  game text,
  set_code text,
  price numeric,
  stock integer,
  image_url text,
  condition text,
  finish text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  printing_id uuid,
  rarity text,
  total_count bigint,
  collector_number text,
  set_name text,
  type_line text,
  colors text[],
  original_price numeric,
  discount_percentage numeric,
  discount_end_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_offset integer;
  v_game_code text;
BEGIN
  v_offset := (page_number - 1) * page_size;

  IF game_filter IS NOT NULL AND array_length(game_filter, 1) > 0 THEN
    v_game_code := game_filter[1];
  ELSE
    v_game_code := NULL;
  END IF;

  RETURN QUERY
  WITH filtered_products AS (
    SELECT
      p.id,
      p.name,
      p.game,
      p.set_code,
      p.price,
      p.stock,
      p.image_url,
      p.condition,
      p.finish,
      p.created_at,
      p.updated_at,
      p.printing_id,
      p.rarity,
      p.collector_number,
      p.set_name,
      p.type_line,
      p.colors,
      p.original_price,
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
      AND (NOT p_only_new OR (UPPER(p.set_code) IN ('SOS', 'SOA', 'SOC', 'TSOS')))
      AND (NOT p_only_discount OR (p.discount_percentage > 0 AND p.discount_end_date > now()))
      AND (NOT p_only_presale OR p.name ILIKE '%(preventa)%')
      AND (
        type_filter IS NULL 
        OR EXISTS (
            SELECT 1 FROM unnest(type_filter) tf WHERE p.type_line ILIKE '%' || tf || '%'
        )
      )
      AND (
        color_filter IS NULL 
        OR EXISTS (
            SELECT 1 FROM unnest(color_filter) cf WHERE p.colors && ARRAY[cf]
        )
      )
  ),
  total AS (
    SELECT COUNT(*) AS cnt FROM filtered_products
  )
  SELECT
    fp.id,
    fp.name,
    fp.game,
    fp.set_code,
    fp.price,
    fp.stock,
    fp.image_url,
    fp.condition,
    fp.finish,
    fp.created_at,
    fp.updated_at,
    fp.printing_id,
    fp.rarity,
    (SELECT cnt FROM total) AS total_count,
    fp.collector_number,
    fp.set_name,
    fp.type_line,
    fp.colors,
    fp.original_price,
    fp.discount_percentage,
    fp.discount_end_date
  FROM filtered_products fp
  ORDER BY
    CASE WHEN sort_by = 'price' AND sort_order = 'asc' THEN fp.price END ASC,
    CASE WHEN sort_by = 'price' AND sort_order = 'desc' THEN fp.price END DESC,
    CASE WHEN sort_by = 'name' AND sort_order = 'asc' THEN fp.name END ASC,
    CASE WHEN sort_by = 'name' AND sort_order = 'desc' THEN fp.name END DESC,
    CASE WHEN sort_by = 'release_date' AND sort_order = 'asc' THEN fp.created_at END ASC,
    CASE WHEN sort_by = 'release_date' AND sort_order = 'desc' THEN fp.created_at END DESC,
    fp.id
  LIMIT page_size
  OFFSET v_offset;
END;
$function$;
