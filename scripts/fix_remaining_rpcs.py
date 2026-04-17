import psycopg2

try:
    conn = psycopg2.connect(
        user="postgres.sxuotvogwvmxuvwbsscv",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    cur = conn.cursor()
    
    # 1. Update add_to_cart
    cur.execute("""
    CREATE OR REPLACE FUNCTION public.add_to_cart(p_product_id uuid, p_quantity integer, p_user_id uuid, p_printing_id text DEFAULT NULL::text, p_finish text DEFAULT 'nonfoil'::text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_cart_id uuid;
        v_resolved_product_id uuid;
        v_printing_uuid uuid;
        v_price numeric;
        v_image_url text;
        v_name text;
        v_set_code text;
        v_finish text := LOWER(COALESCE(p_finish, 'nonfoil'));
    BEGIN
        -- Resolve printing ID if provided
        IF p_printing_id IS NOT NULL THEN
            BEGIN
                v_printing_uuid := p_printing_id::uuid;
            EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object('success', false, 'error', 'Invalid printing_id format');
            END;
        END IF;

        -- 1. Find or create active cart for the user
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id AND is_active = true LIMIT 1;
        IF v_cart_id IS NULL THEN
            INSERT INTO public.carts (user_id, name, is_active, is_pos)
            VALUES (p_user_id, 'Carrito Principal', true, false)
            RETURNING id INTO v_cart_id;
        END IF;

        -- 2. Resolve/Repair Product metadata
        -- If p_product_id was provided directly
        IF p_product_id IS NOT NULL THEN
            SELECT id, price, image_url, name, set_code INTO v_resolved_product_id, v_price, v_image_url, v_name, v_set_code
            FROM public.products WHERE id = p_product_id;
        ELSIF v_printing_uuid IS NOT NULL THEN
            -- Try to find product by printing + NM condition + finish
            SELECT id, price, image_url, name, set_code INTO v_resolved_product_id, v_price, v_image_url, v_name, v_set_code
            FROM public.products 
            WHERE printing_id = v_printing_uuid AND condition = 'NM' AND LOWER(COALESCE(finish, 'nonfoil')) = v_finish;
        END IF;

        -- If product is missing or has issue, repair/create
        IF v_resolved_product_id IS NULL OR COALESCE(v_price, 0) = 0 OR v_image_url IS NULL THEN
            DECLARE
                v_master_price numeric;
                v_master_image text;
                v_master_name text;
                v_master_set text;
                v_printing_to_use uuid := COALESCE(v_printing_uuid, (SELECT printing_id FROM products WHERE id = p_product_id));
            BEGIN
                IF v_printing_to_use IS NOT NULL THEN
                    SELECT 
                        COALESCE(
                            CASE WHEN v_finish = 'foil' THEN ap.avg_market_price_foil_usd ELSE ap.avg_market_price_usd END,
                            (cp.prices->>CASE WHEN v_finish = 'foil' THEN 'usd_foil' ELSE 'usd' END)::numeric,
                            0
                        ),
                        cp.image_url,
                        c.card_name,
                        s.set_code
                    INTO v_master_price, v_master_image, v_master_name, v_master_set
                    FROM public.card_printings cp
                    JOIN public.cards c ON cp.card_id = c.card_id
                    JOIN public.sets s ON cp.set_id = s.set_id
                    LEFT JOIN public.aggregated_prices ap ON cp.printing_id = ap.printing_id
                    WHERE cp.printing_id = v_printing_to_use;

                    IF v_resolved_product_id IS NULL THEN
                        INSERT INTO public.products (printing_id, name, set_code, finish, price, image_url, stock, condition)
                        VALUES (v_printing_to_use, v_master_name, v_master_set, v_finish, COALESCE(v_master_price, 0), v_master_image, 0, 'NM')
                        ON CONFLICT (printing_id, condition, finish) DO UPDATE SET
                            price = CASE WHEN COALESCE(public.products.price, 0) = 0 THEN EXCLUDED.price ELSE public.products.price END
                        RETURNING id INTO v_resolved_product_id;
                    ELSE
                        UPDATE public.products 
                        SET 
                            price = CASE WHEN COALESCE(price, 0) = 0 THEN COALESCE(v_master_price, 0) ELSE price END,
                            image_url = COALESCE(image_url, v_master_image)
                        WHERE id = v_resolved_product_id;
                    END IF;
                END IF;
            END;
        END IF;

        IF v_resolved_product_id IS NULL THEN
             RETURN jsonb_build_object('success', false, 'error', 'Product not found and could not be resolved');
        END IF;

        -- 3. Update or Insert into cart_items
        INSERT INTO public.cart_items (cart_id, product_id, quantity)
        VALUES (v_cart_id, v_resolved_product_id, p_quantity)
        ON CONFLICT (cart_id, product_id) 
        DO UPDATE SET 
            quantity = public.cart_items.quantity + EXCLUDED.quantity,
            updated_at = now();

        RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id, 'product_id', v_resolved_product_id);
    END;
    $$;
    """)

    # 2. Update create_order_atomic (Fixing the product insertion point)
    # Note: Using the previously fetched definition but adding ON CONFLICT
    cur.execute("""
    CREATE OR REPLACE FUNCTION public.create_order_atomic(p_user_id uuid, p_total_amount numeric, p_items jsonb, p_shipping_address jsonb, p_guest_info jsonb)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
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
        v_set_code TEXT;
        v_image_url TEXT;
        v_rarity TEXT;
        v_game_name TEXT;
    BEGIN
        INSERT INTO public.orders (
            user_id, total_amount, status, shipping_address, guest_info
        ) VALUES (
            p_user_id, p_total_amount, 'pending_verification', p_shipping_address, p_guest_info
        ) RETURNING id INTO v_order_id;

        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            v_product_id := (v_item->>'product_id')::UUID;
            v_printing_id := (v_item->>'printing_id')::UUID;
            v_quantity := (v_item->>'quantity')::INTEGER;
            v_price := (v_item->>'price')::NUMERIC;
            v_finish := LOWER(COALESCE(v_item->>'finish', 'nonfoil'));
            v_is_on_demand := COALESCE((v_item->>'is_on_demand')::BOOLEAN, false);

            IF v_product_id IS NOT NULL THEN
                SELECT id, stock, name INTO v_product_id, v_current_stock, v_product_name 
                FROM public.products 
                WHERE id = v_product_id FOR UPDATE;
            END IF;
            
            IF v_product_id IS NULL AND v_printing_id IS NOT NULL THEN
                SELECT id, stock, name INTO v_product_id, v_current_stock, v_product_name
                FROM public.products
                WHERE printing_id = v_printing_id AND LOWER(COALESCE(finish, 'nonfoil')) = v_finish
                AND condition = 'NM' -- Assuming orders from catalog are NM
                FOR UPDATE;

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
                            printing_id, name, game, set_code, price, stock, image_url, rarity, finish, condition
                        ) VALUES (
                            v_printing_id, v_product_name, v_game_name, v_set_code, v_price, 0, v_image_url, v_rarity, v_finish, 'NM'
                        ) 
                        ON CONFLICT (printing_id, condition, finish) DO UPDATE SET
                            updated_at = now()
                        RETURNING id INTO v_product_id;
                        v_current_stock := 0;
                    END IF;
                END IF;
            END IF;

            IF v_product_id IS NULL THEN
                RAISE EXCEPTION 'Product % not found and could not be resolved', (v_item->>'product_id');
            END IF;

            IF NOT v_is_on_demand AND v_current_stock > 0 THEN
                IF v_current_stock < v_quantity THEN
                     RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', v_product_name, v_current_stock, v_quantity;
                END IF;
                UPDATE public.products SET stock = stock - v_quantity WHERE id = v_product_id;
            ELSIF v_current_stock > 0 THEN
                UPDATE public.products SET stock = GREATEST(0, stock - v_quantity) WHERE id = v_product_id;
            END IF;

            INSERT INTO public.order_items (
                order_id, product_id, quantity, price_at_purchase, product_name, finish, is_on_demand
            ) VALUES (
                v_order_id, v_product_id, v_quantity, v_price, v_product_name, v_finish, COALESCE(v_is_on_demand, v_current_stock <= 0)
            );
        END LOOP;

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
    $$;
    """)
    
    conn.commit()
    print("Successfully updated add_to_cart and create_order_atomic RPCs")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
