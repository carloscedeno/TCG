-- Return language and product image_url from get_products_stock_by_printing_ids so CardModal/CardDetail can render per-language variants and localized images.
DROP FUNCTION IF EXISTS public.get_products_stock_by_printing_ids(uuid[]);
CREATE OR REPLACE FUNCTION public.get_products_stock_by_printing_ids(p_printing_ids uuid[])
 RETURNS TABLE(
    id uuid,
    printing_id uuid,
    stock integer,
    price numeric,
    original_price numeric,
    discount_percentage numeric,
    discount_end_date timestamp with time zone,
    finish text,
    language text,
    image_url text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH raw_prices AS (
        SELECT
            p.id,
            p.printing_id,
            p.stock,
            CASE
                WHEN UPPER(COALESCE(p.game, 'MTG')) IN ('MTG', 'MAGIC', '22') THEN
                    COALESCE(
                        NULLIF(CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, 0),
                        NULLIF(p.price_usd, 0),
                        p.price,
                        0
                    )
                ELSE
                    COALESCE(
                        NULLIF(p.price, 0),
                        NULLIF(p.price_usd, 0),
                        CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END,
                        0
                    )
            END AS unit_price,
            p.discount_percentage,
            p.discount_end_date,
            LOWER(COALESCE(p.finish, 'nonfoil')) AS finish_norm,
            UPPER(COALESCE(NULLIF(TRIM(p.language), ''), 'EN')) AS language_norm,
            COALESCE(NULLIF(TRIM(p.image_url), ''), cp.image_url) AS prod_image_url
        FROM public.products p
        LEFT JOIN public.card_printings cp ON p.printing_id = cp.printing_id
        WHERE p.printing_id = ANY(p_printing_ids)
    )
    SELECT
        rp.id,
        rp.printing_id,
        rp.stock,
        ROUND(
            (
                rp.unit_price *
                CASE WHEN rp.discount_percentage > 0 AND (rp.discount_end_date IS NULL OR rp.discount_end_date > now())
                     THEN (1 - rp.discount_percentage / 100.0)
                     ELSE 1.0 END
            )::numeric, 2
        ) AS price,
        ROUND(rp.unit_price::numeric, 2) AS original_price,
        CASE WHEN rp.discount_end_date IS NULL OR rp.discount_end_date > now() THEN COALESCE(rp.discount_percentage, 0) ELSE 0 END AS discount_percentage,
        rp.discount_end_date,
        rp.finish_norm AS finish,
        rp.language_norm AS language,
        rp.prod_image_url AS image_url
    FROM raw_prices rp;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.get_products_stock_by_printing_ids(uuid[]) TO anon, authenticated, service_role;
