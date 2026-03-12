-- Migration: robust_order_creation
-- Description: Updates create_order_atomic to handle missing product records by using printing_id and finish to lazy-create products during checkout.

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id UUID,
    p_items JSONB,
    p_shipping_address JSONB,
    p_total_amount NUMERIC,
    p_guest_info JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_printing_id UUID;
    v_quantity INTEGER;
    v_price NUMERIC;
    v_current_stock INTEGER;
    v_product_name TEXT;
    v_finish TEXT;
    v_is_on_demand BOOLEAN;
    v_cart_id UUID;
    -- For lazy creation
    v_set_code TEXT;
    v_image_url TEXT;
    v_rarity TEXT;
    v_game_name TEXT;
BEGIN
    -- 1. Create Order
    INSERT INTO public.orders (
        user_id,
        total_amount,
        status,
        shipping_address,
        guest_info
    ) VALUES (
        p_user_id,
        p_total_amount,
        'pending_verification',
        p_shipping_address,
        p_guest_info
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_printing_id := (v_item->>'printing_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_price := (v_item->>'price')::NUMERIC;
        v_finish := LOWER(COALESCE(v_item->>'finish', 'nonfoil'));
        v_is_on_demand := COALESCE((v_item->>'is_on_demand')::BOOLEAN, false);

        -- Try to find product by ID
        SELECT id, stock, name INTO v_product_id, v_current_stock, v_product_name 
        FROM public.products 
        WHERE id = v_product_id FOR UPDATE;
        
        -- If not found by ID but we have printing_id, try to find or create by printing_id + finish
        IF v_product_id IS NULL AND v_printing_id IS NOT NULL THEN
            SELECT id, stock, name INTO v_product_id, v_current_stock, v_product_name
            FROM public.products
            WHERE printing_id = v_printing_id AND LOWER(COALESCE(finish, 'nonfoil')) = v_finish
            FOR UPDATE;

            -- Still not found? Lazy create.
            IF v_product_id IS NULL THEN
                SELECT 
                    c.card_name, cp.set_code, cp.image_url, c.rarity, g.game_name
                INTO v_product_name, v_set_code, v_image_url, v_rarity, v_game_name
                FROM card_printings cp
                JOIN cards c ON cp.card_id = c.card_id
                JOIN games g ON c.game_id = g.game_id
                WHERE cp.printing_id = v_printing_id;

                IF v_product_name IS NOT NULL THEN
                    INSERT INTO public.products (
                        printing_id, name, game, set_code, price, stock, image_url, rarity, finish
                    ) VALUES (
                        v_printing_id, v_product_name, v_game_name, v_set_code, v_price, 0, v_image_url, v_rarity, v_finish
                    ) RETURNING id INTO v_product_id;
                    v_current_stock := 0;
                END IF;
            END IF;
        END IF;

        -- Check final result
        IF v_product_id IS NULL THEN
            RAISE EXCEPTION 'Product % not found and could not be resolved', (v_item->>'product_id');
        END IF;

        -- Check and update stock
        -- If it was explicitly marked as on_demand OR stock is 0, we process as on-demand.
        -- If it was expected to be in-stock but stock is low, we fail.
        IF NOT v_is_on_demand AND v_current_stock > 0 THEN
            IF v_current_stock < v_quantity THEN
                 RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', v_product_name, v_current_stock, v_quantity;
            END IF;
            
            UPDATE public.products 
            SET stock = stock - v_quantity
            WHERE id = v_product_id;
        ELSIF v_current_stock > 0 THEN
            -- Is on demand but we have some stock? Use it.
            UPDATE public.products 
            SET stock = GREATEST(0, stock - v_quantity)
            WHERE id = v_product_id;
        END IF;

        -- Record Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            product_name,
            finish,
            is_on_demand
        ) VALUES (
            v_order_id,
            v_product_id,
            v_quantity,
            v_price,
            v_product_name,
            v_finish,
            COALESCE(v_is_on_demand, v_current_stock <= 0)
        );
    END LOOP;

    -- 3. Clear Cart for logged-in users
    IF p_user_id IS NOT NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id;
        IF v_cart_id IS NOT NULL THEN
            DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
