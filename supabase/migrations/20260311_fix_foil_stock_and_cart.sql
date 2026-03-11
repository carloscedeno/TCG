-- Migration: Fix Foil Stock and Cart RPCs
-- Purpose:  Products table already has a `finish` column (nonfoil/foil/etched).
--           This migration updates the RPCs so foil stock is correctly read and
--           foil items are correctly added to cart.
-- Date: 2026-03-11

-- ============================================================
-- 1. get_products_stock_by_printing_ids
--    Add `finish` to the return table so the frontend can
--    correctly match stock to each finish variant.
-- ============================================================
-- DROP required because we are adding a new column to the return type
DROP FUNCTION IF EXISTS public.get_products_stock_by_printing_ids(UUID[]);
CREATE OR REPLACE FUNCTION public.get_products_stock_by_printing_ids(p_printing_ids UUID[])
RETURNS TABLE (
  id       UUID,
  printing_id UUID,
  stock    INT,
  price    NUMERIC,
  finish   TEXT        -- NEW: nonfoil | foil | etched
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.printing_id,
    p.stock,
    p.price,
    LOWER(COALESCE(p.finish, 'nonfoil')) AS finish
  FROM public.products p
  WHERE p.printing_id = ANY(p_printing_ids)
  AND p.stock > 0;
END;
$$;

-- ============================================================
-- 2. add_to_cart
--    Accept an optional p_finish parameter (default 'nonfoil')
--    and filter the products lookup by finish so the correct
--    inventory row is decremented.
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_to_cart(
    p_printing_id uuid,
    p_quantity    integer,
    p_user_id     uuid,
    p_finish      text DEFAULT 'nonfoil'   -- NEW parameter
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id            uuid;
    v_product_id         uuid;
    v_product_stock      integer;
    v_existing_quantity  integer;
    v_finish             text;
BEGIN
    -- Normalize finish value
    v_finish := LOWER(COALESCE(p_finish, 'nonfoil'));

    -- Find the product for this printing_id AND finish
    SELECT id, stock INTO v_product_id, v_product_stock
    FROM products
    WHERE printing_id = p_printing_id
      AND LOWER(COALESCE(finish, 'nonfoil')) = v_finish
      AND stock > 0
    LIMIT 1;

    -- If no product found for this finish, try any finish with stock
    -- (graceful fallback so non-foil imports still work)
    IF v_product_id IS NULL THEN
        SELECT id, stock INTO v_product_id, v_product_stock
        FROM products
        WHERE printing_id = p_printing_id
          AND stock > 0
        ORDER BY
            CASE WHEN LOWER(COALESCE(finish, 'nonfoil')) = v_finish THEN 0 ELSE 1 END
        LIMIT 1;
    END IF;

    -- If still no product found, return error
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

    -- Check and update stock
    IF v_existing_quantity IS NOT NULL THEN
        IF (v_existing_quantity + p_quantity) > v_product_stock THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'message', 'No hay suficiente stock disponible. Stock actual: ' || v_product_stock || ', en carrito: ' || v_existing_quantity
            );
        END IF;

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

-- ============================================================
-- 3. get_user_cart
--    Include finish in the result so the Cart Drawer can show
--    a FOIL badge on foil items.
-- ============================================================
-- DROP required because we are adding finish to the return type
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);
CREATE OR REPLACE FUNCTION public.get_user_cart(
    p_user_id uuid
)
RETURNS TABLE (
    cart_item_id uuid,
    product_id   uuid,
    printing_id  uuid,
    quantity     integer,
    product_name text,
    price        numeric,
    image_url    text,
    set_code     text,
    stock        integer,
    finish       text    -- NEW: nonfoil | foil | etched
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
BEGIN
    SELECT id INTO v_cart_id
    FROM carts
    WHERE user_id = p_user_id;

    IF v_cart_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        ci.id           AS cart_item_id,
        p.id            AS product_id,
        p.printing_id,
        ci.quantity,
        p.name          AS product_name,
        p.price,
        p.image_url,
        p.set_code,
        p.stock,
        LOWER(COALESCE(p.finish, 'nonfoil')) AS finish  -- NEW
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.created_at DESC;
END;
$function$;

-- Grant permissions (keep same as before)
GRANT EXECUTE ON FUNCTION public.get_products_stock_by_printing_ids(UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.add_to_cart(uuid, integer, uuid, text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid)                         TO authenticated;
