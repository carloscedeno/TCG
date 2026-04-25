-- Migration: Normalize Accessory Categories
-- Date: 2026-04-25
-- Description: Creates a structured category taxonomy for accessories,
--              replacing the free-text 'category' field with a normalized
--              'category_code' FK. Zero-breaking — products table is untouched.

BEGIN;

-- ============================================================
-- 1. CREATE accessory_categories CATALOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accessory_categories (
    code        text PRIMARY KEY,           -- 'BOOSTER_BOX', 'ETB', 'SLEEVE', etc.
    name        text NOT NULL,              -- Display name
    parent_code text REFERENCES public.accessory_categories(code),
    sort_order  integer NOT NULL DEFAULT 0,
    icon        text,                       -- Emoji or icon name
    is_active   boolean NOT NULL DEFAULT true
);

-- Disable RLS (read-only lookup table, public)
ALTER TABLE public.accessory_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for accessory_categories" ON public.accessory_categories;
CREATE POLICY "Public read access for accessory_categories"
    ON public.accessory_categories FOR SELECT USING (true);

-- ============================================================
-- 2. SEED CATEGORY VALUES
-- ============================================================

-- Top-level groups
INSERT INTO public.accessory_categories (code, name, parent_code, sort_order, icon) VALUES
    ('SEALED',      'Sellado TCG',      NULL, 1,  '📦'),
    ('ACCESSORIES', 'Accesorios',       NULL, 2,  '🛡️'),
    ('SNACK',       'Snacks & Bebidas', NULL, 3,  '🍿'),
    ('OTHER',       'Otros',            NULL, 99, '📋')
ON CONFLICT (code) DO UPDATE SET
    name       = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    icon       = EXCLUDED.icon;

-- Sealed sub-categories
INSERT INTO public.accessory_categories (code, name, parent_code, sort_order, icon) VALUES
    ('BOOSTER_PACK',  'Sobre / Booster Pack',         'SEALED', 10, '🎴'),
    ('BOOSTER_BOX',   'Booster Box / Display',         'SEALED', 20, '🗃️'),
    ('ETB',           'Elite Trainer Box',             'SEALED', 30, '⭐'),
    ('BUNDLE',        'Bundle / Build & Battle',       'SEALED', 40, '🎁'),
    ('STARTER_DECK',  'Starter / Commander / Precon',  'SEALED', 50, '🃏'),
    ('SPECIAL_SET',   'Tin / Collection Box',          'SEALED', 60, '🥫'),
    ('UPC',           'Ultra Premium Collection',      'SEALED', 70, '💎'),
    ('PROMO_PACK',    'Pack Promo',                    'SEALED', 80, '✨')
ON CONFLICT (code) DO UPDATE SET
    name       = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    icon       = EXCLUDED.icon;

-- Accessories sub-categories (As defined in PRD)
INSERT INTO public.accessory_categories (code, name, parent_code, sort_order, icon) VALUES
    ('SLEEVE',    'Forros',      'ACCESSORIES', 10, '🛡️'),
    ('BINDER',    'Carpetas',    'ACCESSORIES', 20, '📒'),
    ('DICE',      'Dados',       'ACCESSORIES', 30, '🎲'),
    ('PLAYMAT',   'Playmats',    'ACCESSORIES', 40, '🖼️'),
    ('PROTECTOR', 'Protectores', 'ACCESSORIES', 50, '🔒'),
    ('DECKBOX',   'DeckBoxes',   'ACCESSORIES', 60, '📁'),
    ('OTHER',     'Otros',       'ACCESSORIES', 99, '➕')
ON CONFLICT (code) DO UPDATE SET
    name       = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    icon       = EXCLUDED.icon;

-- ============================================================

-- 3. ADD category_code COLUMN TO accessories
-- ============================================================
ALTER TABLE public.accessories
    ADD COLUMN IF NOT EXISTS category_code text REFERENCES public.accessory_categories(code);

-- ============================================================
-- 4. MIGRATE EXISTING DATA — free text → category_code
-- ============================================================
UPDATE public.accessories SET category_code = CASE
    WHEN category ILIKE '%booster box%'
      OR category ILIKE '%display%'
      OR category ILIKE '%booster display%'                THEN 'BOOSTER_BOX'
    WHEN category ILIKE '%booster pack%'
      OR category ILIKE '%sobre%'
      OR category ILIKE '%pack%'                           THEN 'BOOSTER_PACK'
    WHEN category ILIKE '%elite trainer%'
      OR category ILIKE '%etb%'                            THEN 'ETB'
    WHEN category ILIKE '%bundle%'
      OR category ILIKE '%build & battle%'
      OR category ILIKE '%build and battle%'               THEN 'BUNDLE'
    WHEN category ILIKE '%starter%'
      OR category ILIKE '%commander%'
      OR category ILIKE '%precon%'
      OR category ILIKE '%structure deck%'
      OR category ILIKE '%starter deck%'                   THEN 'STARTER_DECK'
    WHEN category ILIKE '%tin%'
      OR category ILIKE '%collection box%'                 THEN 'SPECIAL_SET'
    WHEN category ILIKE '%ultra premium%'
      OR category ILIKE '%upc%'                            THEN 'UPC'
    WHEN category ILIKE '%promo%'                          THEN 'PROMO_PACK'
    WHEN category ILIKE '%sleeve%'
      OR category ILIKE '%mica%'
      OR category ILIKE '%protector%'                      THEN 'SLEEVE'
    WHEN category ILIKE '%deck box%'
      OR category ILIKE '%porta%'
      OR category ILIKE '%deckbox%'                        THEN 'DECKBOX'
    WHEN category ILIKE '%playmat%'                        THEN 'PLAYMAT'
    WHEN category ILIKE '%binder%'
      OR category ILIKE '%carpeta%'                        THEN 'BINDER'
    WHEN category ILIKE '%dado%'
      OR category ILIKE '%counter%'
      OR category ILIKE '%dice%'
      OR category ILIKE '%supplies%'                       THEN 'DICE'
    WHEN category ILIKE '%snack%'
      OR category ILIKE '%bebida%'
      OR category ILIKE '%food%'
      OR category ILIKE '%drink%'                          THEN 'SNACK'
    WHEN category ILIKE '%sealed%'
      OR category ILIKE '%sellado%'                        THEN 'SEALED'
    ELSE 'OTHER'
END
WHERE category_code IS NULL;

-- ============================================================
-- 5. UPDATE get_accessories_filtered RPC
--    Adds p_category_code param alongside existing p_category
-- ============================================================
DROP FUNCTION IF EXISTS public.get_accessories_filtered(integer, text, text, numeric, numeric, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_accessories_filtered(
    p_game_id       integer  DEFAULT NULL,
    p_category      text     DEFAULT NULL,   -- legacy free-text (kept for backward compat)
    p_category_code text     DEFAULT NULL,   -- NEW: normalized code filter
    p_parent_code   text     DEFAULT NULL,   -- NEW: filter by parent group e.g. 'SEALED'
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
            -- game filter
            AND (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL)
            -- legacy category text filter (backward compat)
            AND (p_category IS NULL OR a.category ILIKE '%' || p_category || '%')
            -- new normalized category_code exact filter
            AND (p_category_code IS NULL OR a.category_code = p_category_code)
            -- parent group filter (e.g. show all 'SEALED' products)
            AND (
                p_parent_code IS NULL
                OR a.category_code = p_parent_code
                OR EXISTS (
                    SELECT 1 FROM public.accessory_categories child
                    WHERE child.code = a.category_code
                      AND child.parent_code = p_parent_code
                )
            )
            -- search
            AND (
                p_search_query IS NULL
                OR a.name        ILIKE '%' || p_search_query || '%'
                OR a.description ILIKE '%' || p_search_query || '%'
            )
            -- price range
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

-- ============================================================
-- 6. RPC: get_accessory_categories — for frontend dropdowns
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_accessory_categories(
    p_parent_code text DEFAULT NULL   -- NULL = all top-level groups
)
RETURNS TABLE (
    code        text,
    name        text,
    parent_code text,
    sort_order  integer,
    icon        text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ac.code, ac.name, ac.parent_code, ac.sort_order, ac.icon
    FROM public.accessory_categories ac
    WHERE
        ac.is_active = true
        AND (
            p_parent_code IS NULL
            OR ac.parent_code = p_parent_code
            OR ac.code = p_parent_code
        )
    ORDER BY ac.sort_order ASC, ac.name ASC;
END;
$$;

-- ============================================================
-- 7. SEED MISSING GAMES
--    Ensure all TCGs carried by Geekorium exist in the games table.
--    Existing rows (MTG, Pokémon, One Piece) are untouched.
-- ============================================================
INSERT INTO public.games (game_name, game_code)
VALUES
    ('Riftbound',         'RIFT'),
    ('Gundam Card Game',  'GUNDAM'),
    ('Digimon',           'DIGI'),
    ('Flesh and Blood',   'FAB')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. GRANTS
-- ============================================================
GRANT SELECT ON public.accessory_categories TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_accessories_filtered(
    integer, text, text, text, text, numeric, numeric, text, integer, integer
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_accessory_categories(text)
    TO anon, authenticated;

COMMIT;

