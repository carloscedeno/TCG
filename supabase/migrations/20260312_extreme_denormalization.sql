-- Migration: Extreme Metadata Denormalization (Centralized Pattern)
-- Purpose: Move all filter/sort metadata to products table to achieve <10ms query times
-- Author: Antigravity
-- Date: 2026-03-12

BEGIN;

-- 0. Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Add missing denormalized columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS release_date date,
ADD COLUMN IF NOT EXISTS set_name text,
ADD COLUMN IF NOT EXISTS colors text[],
ADD COLUMN IF NOT EXISTS type_line text;

-- 2. Create the unified sync function
CREATE OR REPLACE FUNCTION public.sync_product_metadata()
RETURNS trigger AS $$
BEGIN
    -- If it's a delete, we don't need to sync (usually managed by foreign keys or soft deletes)
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    -- CASE 1: The change happened in the PRODUCTS table itself
    -- We use a BEFORE trigger here to modify the record directly without new UPDATEs
    IF (TG_TABLE_NAME = 'products') THEN
        SELECT 
            COALESCE(NEW.name, c.card_name),
            COALESCE(NEW.game, g.game_code),
            COALESCE(s.set_code, NEW.set_code),
            s.set_name,
            COALESCE(NEW.rarity, cp.rarity),
            COALESCE(NEW.image_url, cp.image_url),
            s.release_date,
            c.colors,
            c.type_line,
            COALESCE(
                CASE 
                    WHEN LOWER(COALESCE(NEW.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd
                    ELSE cp.avg_market_price_usd 
                END,
                cp.avg_market_price_usd,
                cp.avg_market_price_foil_usd,
                NEW.price,
                0
            )
        INTO 
            NEW.name, NEW.game, NEW.set_code, NEW.set_name, NEW.rarity, 
            NEW.image_url, NEW.release_date, NEW.colors, NEW.type_line, NEW.price_usd
        FROM public.card_printings cp
        JOIN public.cards c ON cp.card_id = c.card_id
        JOIN public.sets s ON cp.set_id = s.set_id
        LEFT JOIN public.games g ON s.game_id = g.game_id
        WHERE cp.printing_id = NEW.printing_id;
        
        RETURN NEW;

    -- CASE 2: The change happened in a source table
    -- We issue a "touch" update on products to trigger the BEFORE trigger above
    ELSIF (TG_TABLE_NAME = 'card_printings') THEN
        UPDATE public.products SET printing_id = printing_id WHERE printing_id = NEW.printing_id;
        RETURN NEW;

    ELSIF (TG_TABLE_NAME = 'cards') THEN
        UPDATE public.products p SET printing_id = p.printing_id 
        FROM public.card_printings cp 
        WHERE p.printing_id = cp.printing_id AND cp.card_id = NEW.card_id;
        RETURN NEW;

    ELSIF (TG_TABLE_NAME = 'sets') THEN
        UPDATE public.products p SET printing_id = p.printing_id 
        FROM public.card_printings cp 
        WHERE p.printing_id = cp.printing_id AND cp.set_id = NEW.set_id;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Cleanup old triggers
DROP TRIGGER IF EXISTS trg_sync_price_on_product_change ON public.products;
DROP TRIGGER IF EXISTS trg_sync_price_on_printing_change ON public.card_printings;
DROP TRIGGER IF EXISTS trg_sync_metadata_on_product ON public.products;
DROP TRIGGER IF EXISTS trg_sync_metadata_on_printing ON public.card_printings;
DROP TRIGGER IF EXISTS trg_sync_metadata_on_card ON public.cards;
DROP TRIGGER IF EXISTS trg_sync_metadata_on_set ON public.sets;

-- 4. Add new triggers
-- Note: product trigger is BEFORE to allow direct modifications
CREATE TRIGGER trg_sync_metadata_on_product
BEFORE INSERT OR UPDATE OF name, printing_id, finish, game, set_code ON public.products
FOR EACH ROW EXECUTE FUNCTION sync_product_metadata();

CREATE TRIGGER trg_sync_metadata_on_printing
AFTER UPDATE OF avg_market_price_usd, avg_market_price_foil_usd, rarity, image_url ON public.card_printings
FOR EACH ROW EXECUTE FUNCTION sync_product_metadata();

CREATE TRIGGER trg_sync_metadata_on_card
AFTER UPDATE OF colors, type_line, card_name ON public.cards
FOR EACH ROW EXECUTE FUNCTION sync_product_metadata();

CREATE TRIGGER trg_sync_metadata_on_set
AFTER UPDATE OF release_date, set_name, set_code ON public.sets
FOR EACH ROW EXECUTE FUNCTION sync_product_metadata();

-- 5. Initial sync (Bulk update)
UPDATE public.products p
SET 
    name = COALESCE(p.name, c.card_name),
    game = COALESCE(p.game, g.game_code),
    set_code = COALESCE(s.set_code, p.set_code),
    set_name = s.set_name,
    rarity = COALESCE(p.rarity, cp.rarity),
    image_url = COALESCE(p.image_url, cp.image_url),
    release_date = s.release_date,
    colors = c.colors,
    type_line = c.type_line,
    price_usd = COALESCE(
        CASE 
            WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd
            ELSE cp.avg_market_price_usd 
        END,
        cp.avg_market_price_usd,
        cp.avg_market_price_foil_usd,
        p.price,
        0
    )
FROM public.card_printings cp
JOIN public.cards c ON cp.card_id = c.card_id
JOIN public.sets s ON cp.set_id = s.set_id
LEFT JOIN public.games g ON s.game_id = g.game_id
WHERE p.printing_id = cp.printing_id;

-- 6. Add indices for ultra-fast filtering
CREATE INDEX IF NOT EXISTS idx_products_release_date ON public.products (release_date DESC);
CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING GIN (colors);
CREATE INDEX IF NOT EXISTS idx_products_price_usd ON public.products (price_usd);
CREATE INDEX IF NOT EXISTS idx_products_set_name ON public.products (set_name);
CREATE INDEX IF NOT EXISTS idx_products_type_line ON public.products (type_line);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);

-- 7. Replace RPC with single-table implementation
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
    year_to integer DEFAULT NULL::integer,
    price_min numeric DEFAULT NULL::numeric,
    price_max numeric DEFAULT NULL::numeric
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
    p.set_code::text,
    p.price_usd as price,
    p.image_url::text,
    p.rarity::text,
    p.printing_id,
    p.stock,
    p.set_name::text,
    LOWER(COALESCE(p.finish, 'nonfoil')) as finish
  FROM public.products p
  WHERE 
    p.stock > 0
    AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
    AND (
         v_game_code IS NULL 
         OR p.game = v_game_code
         OR (v_game_code = 'MTG' AND p.game IN ('Magic', '22'))
    )
    AND (set_filter IS NULL OR p.set_name = ANY(set_filter))
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    AND (
      color_filter IS NULL 
      OR p.colors && color_filter
    )
    AND (year_from IS NULL OR EXTRACT(YEAR FROM p.release_date) >= year_from)
    AND (year_to IS NULL OR EXTRACT(YEAR FROM p.release_date) <= year_to)
    AND (price_min IS NULL OR p.price_usd >= price_min)
    AND (price_max IS NULL OR p.price_usd <= price_max)
    AND (type_filter IS NULL OR EXISTS (
        SELECT 1 FROM unnest(type_filter) tf 
        WHERE p.type_line ILIKE '%' || tf || '%'
    ))
  ORDER BY
    CASE 
        WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 
        WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 1
        ELSE 2 
    END ASC,
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

COMMIT;
