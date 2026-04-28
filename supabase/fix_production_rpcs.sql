-- EMERGENCY FIX: Restore Production RPCs
-- Date: 2026-04-28
-- Description: Drops all overloads and re-creates the essential RPC functions for the storefront.

BEGIN;

-- 1. CLEANUP get_products_filtered
-- Drop all possible signatures to resolve PGRST203 (Overloading)
DROP FUNCTION IF EXISTS public.get_products_filtered(text,text,text[],text[],text[],text[],integer,integer,text,integer,integer,numeric,numeric,boolean);
DROP FUNCTION IF EXISTS public.get_products_filtered(text,text,text[],text[],text[],text[],integer,integer,numeric,numeric,integer,integer,boolean,text);
DROP FUNCTION IF EXISTS public.get_products_filtered(text,text,text[],text[],text[],text[],integer,integer,text,integer,integer,numeric,numeric,boolean,text);

-- 2. RE-CREATE get_products_filtered (Latest SKU-Aware & Stock-Aware Logic)
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
AS $$
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
$$;

-- 3. CLEANUP get_accessories_filtered
-- Drop all overloads to resolve PGRST202/PGRST203
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer,text,integer,integer);
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer,text,text,numeric,numeric,text,integer,integer);
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer,text,text,text,text,numeric,numeric,text,integer,integer);

-- 4. RE-CREATE get_accessories_filtered (Latest Logic)
CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id       integer  DEFAULT NULL,
    p_category      text     DEFAULT NULL,
    p_category_code text     DEFAULT NULL,
    p_parent_code   text     DEFAULT NULL,
    p_search_query  text     DEFAULT NULL,
    p_price_min     numeric  DEFAULT NULL,
    p_price_max     numeric  DEFAULT NULL,
    p_sort          text     DEFAULT 'newest',
    p_limit         integer  DEFAULT 50,
    p_offset        integer  DEFAULT 0
)
RETURNS TABLE (
    id              uuid,
    name            text,
    description     text,
    price           numeric,
    stock           integer,
    image_url       text,
    category        text,
    category_code   text,
    category_name   text,
    category_icon   text,
    game_id         integer,
    created_at      timestamptz,
    cost            numeric,
    suggested_price numeric,
    unit_type       text,
    language        text,
    total_count     bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT
            a.id, a.name, a.description, a.price, a.stock, a.image_url,
            a.category, a.category_code,
            ac.name   AS category_name,
            ac.icon   AS category_icon,
            a.game_id, a.created_at,
            a.cost, a.suggested_price, a.unit_type, a.language
        FROM public.accessories a
        LEFT JOIN public.accessory_categories ac ON a.category_code = ac.code
        WHERE
            a.is_active = true
            AND (p_game_id IS NULL OR a.game_id = p_game_id)
            AND (p_category IS NULL OR a.category ILIKE '%' || p_category || '%')
            AND (p_category_code IS NULL OR a.category_code = p_category_code)
            AND (
                p_parent_code IS NULL
                OR a.category_code = p_parent_code
                OR EXISTS (
                    SELECT 1 FROM public.accessory_categories child
                    WHERE child.code = a.category_code
                      AND child.parent_code = p_parent_code
                )
            )
            AND (
                p_search_query IS NULL
                OR a.name        ILIKE '%' || p_search_query || '%'
                OR a.description ILIKE '%' || p_search_query || '%'
            )
            AND (p_price_min IS NULL OR a.price >= p_price_min)
            AND (p_price_max IS NULL OR a.price <= p_price_max)
    ),
    total AS (
        SELECT count(*) AS full_count FROM filtered_data
    )
    SELECT
        f.id, f.name, f.description, f.price, f.stock, f.image_url,
        f.category, f.category_code, f.category_name, f.category_icon,
        f.game_id, f.created_at,
        f.cost, f.suggested_price, f.unit_type, f.language,
        t.full_count
    FROM filtered_data f, total t
    ORDER BY
        CASE WHEN p_sort = 'price_asc'  THEN f.price       END ASC,
        CASE WHEN p_sort = 'price_desc' THEN f.price       END DESC,
        CASE WHEN p_sort = 'name'       THEN f.name        END ASC,
        CASE WHEN p_sort = 'newest'     THEN f.created_at  END DESC NULLS LAST,
        f.created_at DESC
    LIMIT  p_limit
    OFFSET p_offset;
END;
$$;

-- 5. GRANTS
GRANT EXECUTE ON FUNCTION public.get_products_filtered TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_accessories_filtered TO anon, authenticated, service_role;

COMMIT;
