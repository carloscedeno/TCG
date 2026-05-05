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
            'product_id', p.id,
            'printing_id', p.printing_id,
            'quantity', ci.quantity,
            'price', CASE WHEN p.discount_end_date IS NOT NULL AND p.discount_end_date > now() 
                          THEN ROUND(p.price * (1 - p.discount_percentage / 100.0), 2)
                          ELSE COALESCE(p.price, 0) END,
            'original_price', COALESCE(p.price, 0),
            'discount_percentage', COALESCE(p.discount_percentage, 0),
            'name', p.name,
            'image_url', p.image_url,
            'set_code', p.set_code,
            'finish', COALESCE(p.finish, 'nonfoil'),
            'stock', COALESCE(p.stock, 0)
        )
    )
    INTO v_items
    FROM public.cart_items ci
    JOIN public.products p ON ci.product_id = p.id
    WHERE ci.cart_id = v_cart_id;

    RETURN QUERY SELECT v_cart_id, v_cart_name, v_is_pos, COALESCE(v_items, '[]'::jsonb);
END;
$function$;
