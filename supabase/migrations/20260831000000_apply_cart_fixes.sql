-- Migration: apply_cart_fixes
-- Date: 2026-08-31
-- Description: Applies the fixes to add_to_cart_v2 and get_user_cart to production.

CREATE OR REPLACE FUNCTION public.add_to_cart_v2(p_identifier text, p_quantity integer, p_finish text DEFAULT 'nonfoil'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
      v_user_id uuid;
      v_product_id uuid;
      v_cart_id uuid;
      v_printing_id uuid;
      v_name text;
      v_set_code text;
      v_image_url text;
      v_price numeric;
      v_clean_id text;
      v_p_finish text;
    BEGIN
      -- Normalización de parámetros
      v_p_finish := LOWER(COALESCE(p_finish, 'nonfoil'));
      
      -- Extraer exactamente el primer UUID que aparezca en la cadena (maneja sufijos como -foil)
      v_clean_id := (REGEXP_MATCH(p_identifier, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'))[1];

      IF v_clean_id IS NULL THEN
         RETURN jsonb_build_object('success', false, 'message', 'Identificador no válido: no se encontró UUID');
      END IF;

      -- Prioridad a auth.uid() para seguridad
      v_user_id := auth.uid();
      
      IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Sesión no válida');
      END IF;

      -- 1. Intentar encontrar como PRODUCTO físico existente
      -- Buscamos por ID directo o por printing_id con el finish solicitado
      SELECT id INTO v_product_id 
      FROM public.products 
      WHERE (id::text = v_clean_id OR (printing_id::text = v_clean_id AND LOWER(COALESCE(finish, 'nonfoil')) = v_p_finish))
      ORDER BY stock DESC, updated_at DESC
      LIMIT 1;

      -- 2. Si no es un producto físico en inventario, intentar crear uno virtual desde el catálogo (printing_id o card_id)
      IF v_product_id IS NULL THEN
        
        -- Intentamos resolver el ID ya sea porque es un printing_id OR un card_id
        SELECT 
          c.card_name, s.set_code, cp.image_url, 
          COALESCE(
            CASE WHEN v_p_finish = 'foil' THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END,
            0
          ) as mkt_price,
          cp.printing_id -- Capturamos el verdadero printing_id por si nos pasaron un card_id
        INTO v_name, v_set_code, v_image_url, v_price, v_printing_id
        FROM public.card_printings cp
        JOIN public.cards c ON cp.card_id = c.card_id
        JOIN public.sets s ON cp.set_id = s.set_id
        WHERE cp.printing_id = v_clean_id::uuid OR cp.card_id = v_clean_id::uuid
        ORDER BY cp.release_date DESC NULLS LAST
        LIMIT 1;

        IF v_name IS NOT NULL THEN
          -- Creamos la entrada en products con stock 0 (On Demand/Virtual)
          INSERT INTO public.products (printing_id, condition, finish, stock, price, name, set_code, image_url)
          VALUES (v_printing_id, 'NM', v_p_finish, 0, v_price, v_name, v_set_code, v_image_url)
          ON CONFLICT (printing_id, condition, finish) DO UPDATE SET 
            price = CASE WHEN COALESCE(public.products.price, 0) = 0 THEN EXCLUDED.price ELSE public.products.price END
          RETURNING id INTO v_product_id;
        END IF;
      END IF;

      IF v_product_id IS NULL THEN
         RETURN jsonb_build_object('success', false, 'message', 'No se pudo identificar la entidad');
      END IF;

      -- 3. Obtener o crear carrito activo para el usuario (Priorizando el modificado más recientemente)
      SELECT id INTO v_cart_id FROM public.carts 
      WHERE user_id = v_user_id AND is_active = true 
      ORDER BY updated_at DESC LIMIT 1;
      
      IF v_cart_id IS NULL THEN
        INSERT INTO public.carts (user_id, name, is_active)
        VALUES (v_user_id, 'Carrito Principal', true)
        RETURNING id INTO v_cart_id;
      END IF;

      -- 4. Agregar ítem al carrito
      INSERT INTO public.cart_items (cart_id, product_id, quantity, updated_at)
      VALUES (v_cart_id, v_product_id, p_quantity, now())
      ON CONFLICT (cart_id, product_id) DO UPDATE SET 
        quantity = public.cart_items.quantity + EXCLUDED.quantity,
        updated_at = now();

      -- 5. Actualizar updated_at del carrito para sincronización con get_user_cart
      UPDATE public.carts SET updated_at = now() WHERE id = v_cart_id;

      RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id, 'product_id', v_product_id);
    END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid, OUT cart_id uuid, OUT cart_name text, OUT is_pos boolean, OUT items jsonb)
 RETURNS record
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

    SELECT jsonb_agg(item_data)
    INTO v_items
    FROM (
        -- Cards
        SELECT jsonb_build_object(
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
            'stock', COALESCE(p.stock, 0),
            'is_accessory', false
        ) as item_data
        FROM public.cart_items ci
        JOIN public.products p ON ci.product_id = p.id
        WHERE ci.cart_id = v_cart_id
        
        UNION ALL
        
        -- Accessories
        SELECT jsonb_build_object(
            'id', ci.id,
            'accessory_id', a.id,
            'product_id', null,
            'printing_id', null,
            'quantity', ci.quantity,
            'price', CASE WHEN a.discount_until IS NOT NULL AND a.discount_until > now() 
                          THEN ROUND(a.price * (1 - a.discount_percentage / 100.0), 2)
                          ELSE COALESCE(a.price, 0) END,
            'original_price', COALESCE(a.price, 0),
            'discount_percentage', COALESCE(a.discount_percentage, 0),
            'name', a.name,
            'image_url', a.image_url,
            'set_code', a.category,
            'finish', 'standard',
            'stock', COALESCE(a.stock, 0),
            'is_accessory', true
        ) as item_data
        FROM public.cart_items ci
        JOIN public.accessories a ON ci.accessory_id = a.id
        WHERE ci.cart_id = v_cart_id
    ) sub;

    cart_id := v_cart_id;
    cart_name := v_cart_name;
    is_pos := v_is_pos;
    items := COALESCE(v_items, '[]'::jsonb);
END;
$function$;
