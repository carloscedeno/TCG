-- Migration: allow_on_demand_orders
-- Description: Modifies add_to_cart and get_products_stock_by_printing_ids to support ordering items with zero stock as "Por Encargo".

-- 1. Redefine get_products_stock_by_printing_ids to include zero-stock items
DROP FUNCTION IF EXISTS public.get_products_stock_by_printing_ids(UUID[]);
CREATE OR REPLACE FUNCTION public.get_products_stock_by_printing_ids(p_printing_ids UUID[])
RETURNS TABLE (
  id       UUID,
  printing_id UUID,
  stock    INT,
  price    NUMERIC,
  finish   TEXT
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
  WHERE p.printing_id = ANY(p_printing_ids);
  -- REMOVED: AND p.stock > 0
END;
$$;

-- 2. Redefine add_to_cart with lazy-create and no stock blocks
CREATE OR REPLACE FUNCTION public.add_to_cart(
    p_printing_id uuid,
    p_quantity    integer,
    p_user_id     uuid,
    p_finish      text DEFAULT 'nonfoil'
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
    v_card_name          text;
    v_set_code           text;
    v_price              numeric;
    v_image_url          text;
    v_rarity             text;
    v_game_name          text;
BEGIN
    -- Normalize finish value
    v_finish := LOWER(COALESCE(p_finish, 'nonfoil'));

    -- Find the product for this printing_id AND finish
    SELECT id, stock INTO v_product_id, v_product_stock
    FROM products
    WHERE printing_id = p_printing_id
      AND LOWER(COALESCE(finish, 'nonfoil')) = v_finish
    LIMIT 1;

    -- If no product found for this finish, try to create it from card_printings/cards/games
    IF v_product_id IS NULL THEN
        -- Get data for lazy creation
        -- We try to get the most accurate price from card_printings or fallbacks
        SELECT 
            c.card_name,
            cp.set_code,
            COALESCE(
                CASE WHEN v_finish = 'foil' THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END,
                0
            ) as price,
            cp.image_url,
            c.rarity,
            g.game_name
        INTO v_card_name, v_set_code, v_price, v_image_url, v_rarity, v_game_name
        FROM card_printings cp
        JOIN cards c ON cp.card_id = c.card_id
        JOIN games g ON c.game_id = g.game_id
        WHERE cp.printing_id = p_printing_id;

        IF v_card_name IS NOT NULL THEN
            INSERT INTO products (
                printing_id,
                name,
                game,
                set_code,
                price,
                stock,
                image_url,
                rarity,
                finish
            ) VALUES (
                p_printing_id,
                v_card_name,
                v_game_name,
                v_set_code,
                v_price,
                0, -- Initial stock is 0 for on-demand
                v_image_url,
                v_rarity,
                v_finish
            ) RETURNING id, stock INTO v_product_id, v_product_stock;
        END IF;
    END IF;

    -- If still no product found (and couldn't create one), return error
    IF v_product_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found',
            'message', 'No se pudo encontrar o crear esta versión de la carta.'
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

    -- Update or insert into cart_items
    -- REMOVED: Stock checks (p_quantity > v_product_stock)
    IF v_existing_quantity IS NOT NULL THEN
        UPDATE cart_items
        SET quantity = quantity + p_quantity
        WHERE cart_id = v_cart_id AND product_id = v_product_id;
    ELSE
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (v_cart_id, v_product_id, p_quantity);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'cart_id', v_cart_id,
        'product_id', v_product_id,
        'is_on_demand', (v_product_stock <= 0)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_products_stock_by_printing_ids(UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.add_to_cart(uuid, integer, uuid, text)      TO authenticated;
