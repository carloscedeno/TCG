-- Drop old overloaded versions of get_products_filtered to avoid PGRST203 errors

-- The version from 20260426000002_fix_rpc_filtering.sql
DROP FUNCTION IF EXISTS public.get_products_filtered(
    text, text, text[], text[], text[], text[], integer, integer, text, integer, integer, numeric, numeric, boolean
);

-- The version from 20260415201900_global_new_cards_filter.sql
DROP FUNCTION IF EXISTS public.get_products_filtered(
    text, text, text[], text[], text[], text[], integer, integer, text, integer, integer, numeric, numeric, boolean
);

-- Also drop any other possible permutations just to be safe:
-- (some older versions might not have p_only_new or sort_by)
DROP FUNCTION IF EXISTS public.get_products_filtered(text, text, text[], text[], text[], text[], integer, integer, text, integer, integer, numeric, numeric);
DROP FUNCTION IF EXISTS public.get_products_filtered(text, text, text[], text[], text[], text[], integer, integer, integer, integer, numeric, numeric);

-- We KEEP the current one which is defined as:
-- get_products_filtered(text, text, text[], text[], text[], text[], integer, integer, numeric, numeric, integer, integer, boolean, text)
