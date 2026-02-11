-- Migration: Add to Cart RPC
-- Description: Create RPC function for adding items to cart with proper product validation
-- Date: 2026-02-11

-- Function: Add item to cart
-- Validates that the printing_id has a corresponding product in inventory before adding
CREATE OR REPLACE FUNCTION public.add_to_cart(
    p_printing_id uuid,
    p_quantity integer,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
    v_product_id uuid;
    v_product_stock integer;
    v_existing_quantity integer;
BEGIN
    -- Find the product_id for this printing_id
    SELECT id, stock INTO v_product_id, v_product_stock
    FROM products
    WHERE printing_id = p_printing_id
    AND stock > 0
    LIMIT 1;
    
    -- If no product found in inventory, return error
    IF v_product_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Product not available in inventory',
            'message', 'Esta versión de la carta no está disponible en inventario. Por favor selecciona otra versión.'
        );
    END IF;
    
    -- Get or create cart for user
    SELECT id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id;
    
    IF v_cart_id IS NULL THEN
        INSERT INTO carts (user_id)
        VALUES (p_user_id)
        RETURNING id INTO v_cart_id;
    END IF;
    
    -- Check if item already exists in cart
    SELECT quantity INTO v_existing_quantity
    FROM cart_items
    WHERE cart_id = v_cart_id AND product_id = v_product_id;
    
    -- Check stock availability
    IF v_existing_quantity IS NOT NULL THEN
        IF (v_existing_quantity + p_quantity) > v_product_stock THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'message', 'No hay suficiente stock disponible. Stock actual: ' || v_product_stock || ', en carrito: ' || v_existing_quantity
            );
        END IF;
        
        -- Update existing cart item
        UPDATE cart_items
        SET quantity = quantity + p_quantity
        WHERE cart_id = v_cart_id AND product_id = v_product_id;
    ELSE
        IF p_quantity > v_product_stock THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'message', 'No hay suficiente stock disponible. Stock actual: ' || v_product_stock
            );
        END IF;
        
        -- Insert new cart item
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (v_cart_id, v_product_id, p_quantity);
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'cart_id', v_cart_id,
        'product_id', v_product_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$function$;

-- Function: Get user cart with product details
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
        p.price,
        p.image_url,
        p.set_code,
        p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.created_at DESC;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_to_cart(uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid) TO authenticated;
