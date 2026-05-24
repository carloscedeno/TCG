-- Cleanup redundant RPC overloads to resolve PostgREST ambiguity (PGRST203)
-- and standardizing game data to resolve catalog filtering issues.

-- 1. DROP Ambiguous Cart & Inventory RPCs (Cleanup Overloads)
DROP FUNCTION IF EXISTS public.add_to_cart_v2(uuid, uuid, integer, text, boolean);
DROP FUNCTION IF EXISTS public.add_to_cart_v2(p_user_id uuid, p_printing_id uuid, p_quantity integer, p_finish text, p_is_pos boolean);

DROP FUNCTION IF EXISTS public.create_order_atomic(uuid, jsonb, numeric, jsonb, uuid);
DROP FUNCTION IF EXISTS public.create_order_atomic(p_user_id uuid, p_items jsonb, p_total_amount numeric, p_shipping_address jsonb, p_guest_info jsonb);

DROP FUNCTION IF EXISTS public.get_inventory_list(text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.get_inventory_list(p_search text, p_game text, p_limit integer, p_offset integer, p_sort text);

-- 2. Standardize Games Table (Remove Duplicates)
-- Merge 'YGO' into 'YUGIOH' (Standardize on ID 26)
UPDATE public.products SET game = 'YUGIOH' WHERE game IN ('YGO', 'Yu-Gi-Oh!');
UPDATE public.accessories SET game_id = 26 WHERE game_id = 11;
UPDATE public.sets SET game_id = 26 WHERE game_id = 11;
UPDATE public.cards SET game_id = 26 WHERE game_id = 11;
UPDATE public.hero_banners SET game_code = 'YUGIOH' WHERE game_code = 'YGO';
DELETE FROM public.games WHERE game_id = 11;

-- Merge 'PKM' into 'POKEMON' (Standardize on ID 23)
UPDATE public.products SET game = 'POKEMON' WHERE game IN ('PKM', 'Pokémon');
UPDATE public.accessories SET game_id = 23 WHERE game_id = 10;
UPDATE public.sets SET game_id = 23 WHERE game_id = 10;
UPDATE public.cards SET game_id = 23 WHERE game_id = 10;
UPDATE public.hero_banners SET game_code = 'POKEMON' WHERE game_code = 'PKM';
DELETE FROM public.games WHERE game_id = 10;

-- 3. Create missing view for Edge Function
CREATE OR REPLACE VIEW public.products_with_prices AS
 SELECT p.id,
    p.printing_id,
    p.name,
    p.condition,
    p.stock,
    p.image_url,
    p.set_code,
    p.game,
    p.created_at,
    p.updated_at,
    COALESCE(cp.avg_market_price_usd, p.price, (0)::numeric) AS effective_price
   FROM (products p
     LEFT JOIN card_printings cp ON ((p.printing_id = cp.printing_id)));

GRANT SELECT ON public.products_with_prices TO anon, authenticated, service_role;
