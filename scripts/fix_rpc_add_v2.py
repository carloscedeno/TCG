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
    
    # Read the full add_to_cart_v2 definition to fix the ON CONFLICT clause
    cur.execute("""
    CREATE OR REPLACE FUNCTION public.add_to_cart_v2(
        p_identifier text,
        p_quantity integer,
        p_finish text DEFAULT 'nonfoil'
    )
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_user_id uuid;
      v_cart_id uuid;
      v_product_id uuid;
      v_printing_id uuid;
      v_price numeric;
      v_name text;
      v_set_code text;
      v_image_url text;
    BEGIN
      -- Get user ID
      v_user_id := auth.uid();
      IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No autenticado');
      END IF;

      -- Resolve printing_id from identifier (it could be product_id or printing_id)
      -- Check if it is a valid UUID
      BEGIN
        v_printing_id := p_identifier::uuid;
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'ID de producto inválido');
      END;

      -- Check if it's already a product_id or a printing_id
      SELECT id INTO v_product_id FROM public.products WHERE id = v_printing_id;
      
      IF v_product_id IS NOT NULL THEN
        -- It was a product_id! We are good.
      ELSE
        -- It was likely a printing_id (Scryfall ID)
        -- Try to find an existing product for this printing + condition (NM) + finish
        SELECT id INTO v_product_id FROM public.products 
        WHERE printing_id = v_printing_id AND condition = 'NM' AND LOWER(COALESCE(finish, 'nonfoil')) = LOWER(COALESCE(p_finish, 'nonfoil'));

        IF v_product_id IS NULL THEN
          -- Need to create a product entry (stock 0) before adding to cart
          -- Fetch card details from master tables
          SELECT 
            c.card_name, s.set_code, cp.image_url,
            COALESCE(
              CASE WHEN LOWER(COALESCE(p_finish, 'nonfoil')) = 'foil' THEN ap.avg_market_price_foil_usd ELSE ap.avg_market_price_usd END,
              0
            ) as mkt_price
          INTO v_name, v_set_code, v_image_url, v_price
          FROM public.card_printings cp
          JOIN public.cards c ON cp.card_id = c.card_id
          JOIN public.sets s ON cp.set_id = s.set_id
          LEFT JOIN public.aggregated_prices ap ON cp.printing_id = ap.printing_id
          WHERE cp.printing_id = v_printing_id;

          IF v_name IS NULL THEN
             RETURN jsonb_build_object('success', false, 'message', 'Producto no encontrado en catálogo');
          END IF;

          INSERT INTO public.products (printing_id, condition, finish, stock, price, name, set_code, image_url)
          VALUES (v_printing_id, 'NM', LOWER(COALESCE(p_finish, 'nonfoil')), 0, v_price, v_name, v_set_code, v_image_url)
          ON CONFLICT (printing_id, condition, finish) DO UPDATE SET 
            price = CASE WHEN COALESCE(public.products.price, 0) = 0 THEN EXCLUDED.price ELSE public.products.price END
          RETURNING id INTO v_product_id;
        END IF;
      END IF;

      -- Get or create active cart
      SELECT id INTO v_cart_id FROM public.carts WHERE user_id = v_user_id AND is_active = true LIMIT 1;
      
      IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active)
        VALUES (v_user_id, 'Carrito Principal', true)
        RETURNING id INTO v_cart_id;
      END IF;

      -- Add to cart_items
      INSERT INTO public.cart_items (cart_id, product_id, quantity, updated_at)
      VALUES (v_cart_id, v_product_id, p_quantity, now())
      ON CONFLICT (cart_id, product_id) DO UPDATE SET 
        quantity = public.cart_items.quantity + EXCLUDED.quantity,
        updated_at = now();

      RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id, 'product_id', v_product_id);
    END;
    $$;
    """)
    
    conn.commit()
    print("Successfully updated add_to_cart_v2 RPC")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
