-- Migration: Fix Cart Price Fallback
-- Description: Update get_user_cart to fallback to market price if store price is 0
-- Date: 2026-02-16

-- Drop previous version first to allow return type changes
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);

CREATE OR REPLACE FUNCTION public.get_user_cart(
    p_user_id uuid
)
RETURNS TABLE (
    cart_item_id uuid,
    product_id uuid,
    printing_id uuid,
    quantity integer,
    product_name text,
    price numeric,
    image_url text,
    set_code text,
    stock integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
BEGIN
    -- Get cart ID for user
    SELECT id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id;
    
    -- If no cart exists, return empty result
    IF v_cart_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Return cart items with product details
    RETURN QUERY
    SELECT 
        ci.id as cart_item_id,
        p.id as product_id,
        p.printing_id,
        ci.quantity,
        p.name as product_name,
        -- Use market price if store price is 0 or NULL
        COALESCE(NULLIF(p.price, 0), ap.avg_market_price_usd, 0) as price,
        p.image_url,
        p.set_code,
        p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN aggregated_prices ap ON p.printing_id = ap.printing_id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.created_at DESC;
END;
$function$;
