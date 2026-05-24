-- Migración para corregir el retorno y aplicación de descuentos en stock y carrito
-- 1. Actualizar get_products_stock_by_printing_ids para retornar original_price, discount_percentage, discount_end_date
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
    finish text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.printing_id,
        p.stock,
        ROUND(
            (
                COALESCE(
                    CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd 
                         ELSE cp.avg_market_price_usd END, 
                    p.price_usd, p.price, 0
                ) * 
                CASE WHEN p.discount_percentage > 0 AND p.discount_end_date > now() 
                     THEN (1 - p.discount_percentage / 100.0) 
                     ELSE 1.0 END
            )::numeric, 2
        ) as price,
        COALESCE(
            CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd 
                 ELSE cp.avg_market_price_usd END, 
            p.price_usd, p.price, 0
        ) as original_price,
        CASE WHEN p.discount_end_date > now() THEN COALESCE(p.discount_percentage, 0) ELSE 0 END as discount_percentage,
        p.discount_end_date,
        LOWER(COALESCE(p.finish, 'nonfoil')) AS finish
    FROM public.products p
    LEFT JOIN public.card_printings cp ON p.printing_id = cp.printing_id
    WHERE p.printing_id = ANY(p_printing_ids);
END;
$function$;

-- 2. Actualizar get_user_cart para aplicar descuentos a los accesorios
CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
 RETURNS TABLE(cart_id uuid, cart_name text, is_pos boolean, items jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
    v_cart_name text;
    v_is_pos boolean;
    v_items jsonb;
BEGIN
    SELECT c.id, c.name, COALESCE(c.is_pos, false)
    INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts c
    WHERE c.user_id = p_user_id AND c.is_active = true
    ORDER BY c.updated_at DESC
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active, is_pos)
        VALUES (p_user_id, 'Carrito Principal', true, false)
        RETURNING id, name, false INTO v_cart_id, v_cart_name, v_is_pos;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ci.id,
            'product_id', ci.product_id,
            'accessory_id', ci.accessory_id,
            'printing_id', COALESCE(p.printing_id::text, ci.accessory_id::text),
            'quantity', ci.quantity,
            'price', CASE WHEN ci.accessory_id IS NOT NULL THEN 
                            CASE WHEN a.discount_percentage > 0 AND a.discount_until > now()
                                 THEN ROUND((a.price * (1 - a.discount_percentage / 100.0))::numeric, 2)
                                 ELSE COALESCE(a.price, 0) END
                          WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
                          THEN ROUND((p.price * (1 - p.discount_percentage / 100.0))::numeric, 2)
                          ELSE COALESCE(p.price, 0) END,
            'original_price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0) ELSE COALESCE(p.price, 0) END,
            'discount_percentage', CASE WHEN ci.accessory_id IS NOT NULL THEN CASE WHEN a.discount_until > now() THEN COALESCE(a.discount_percentage, 0) ELSE 0 END ELSE CASE WHEN p.discount_end_date > now() THEN COALESCE(p.discount_percentage, 0) ELSE 0 END END,
            'name', COALESCE(p.name, a.name),
            'image_url', COALESCE(p.image_url, a.image_url),
            'set_code', COALESCE(p.set_code, a.category),
            'finish', COALESCE(p.finish, 'nonfoil'),
            'stock', COALESCE(p.stock, a.stock, 0),
            'type', CASE WHEN ci.accessory_id IS NOT NULL THEN 'accessory' ELSE 'product' END,
            'is_accessory', CASE WHEN ci.accessory_id IS NOT NULL THEN true ELSE false END
        )
    )
    INTO v_items
    FROM public.cart_items ci
    LEFT JOIN public.products p ON ci.product_id = p.id
    LEFT JOIN public.accessories a ON ci.accessory_id = a.id
    WHERE ci.cart_id = v_cart_id;

    RETURN QUERY SELECT v_cart_id, v_cart_name, v_is_pos, COALESCE(v_items, '[]'::jsonb);
END;
$function$;
