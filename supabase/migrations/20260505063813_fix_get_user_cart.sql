-- Fix get_user_cart RPC to use updated_at instead of last_accessed_at

DROP FUNCTION IF EXISTS public.get_user_cart(uuid);

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
    SELECT id, name, COALESCE(public.carts.is_pos, false)
    INTO v_cart_id, v_cart_name, v_is_pos
    FROM public.carts
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY updated_at DESC
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
            'price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0)
                          WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
                          THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
                          ELSE COALESCE(p.price, 0) END,
            'original_price', CASE WHEN ci.accessory_id IS NOT NULL THEN COALESCE(a.price, 0) ELSE COALESCE(p.price, 0) END,
            'discount_percentage', CASE WHEN ci.accessory_id IS NOT NULL THEN 0 ELSE COALESCE(p.discount_percentage, 0) END,
            'name', COALESCE(p.name, a.name),
            'image_url', COALESCE(p.image_url, a.image_url),
            'set_code', COALESCE(p.set_code, a.category),
            'finish', COALESCE(p.finish, 'nonfoil'),
            'stock', COALESCE(p.stock, a.stock, 0),
            'type', CASE WHEN ci.accessory_id IS NOT NULL THEN 'accessory' ELSE 'product' END
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
