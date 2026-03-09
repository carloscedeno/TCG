-- Update search function to prioritize exact matches
CREATE OR REPLACE FUNCTION public.get_products_filtered(search_query text DEFAULT NULL::text, game_filter text DEFAULT NULL::text, set_filter text[] DEFAULT NULL::text[], rarity_filter text[] DEFAULT NULL::text[], type_filter text[] DEFAULT NULL::text[], color_filter text[] DEFAULT NULL::text[], sort_by text DEFAULT 'newest'::text, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0, year_from integer DEFAULT NULL::integer, year_to integer DEFAULT NULL::integer)
 RETURNS TABLE(id uuid, name text, game text, set_code text, price numeric, image_url text, rarity text, printing_id uuid, stock integer, set_name text)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_game_code TEXT;
  v_sort_by TEXT;
BEGIN
  -- Normalize Inputs
  v_sort_by := LOWER(TRIM(COALESCE(sort_by, 'newest')));
  
  -- Simple Game Mapping
  IF game_filter ILIKE 'Magic%' OR game_filter = 'MTG' THEN
    v_game_code := 'MTG';
  ELSIF game_filter ILIKE 'Poke%' OR game_filter = 'PKM' THEN
    v_game_code := 'POKEMON';
  ELSE
    v_game_code := game_filter; -- Fallback
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.game,
    p.set_code,
    CASE 
        WHEN p.price > 0 THEN p.price 
        ELSE COALESCE(ap.avg_market_price_usd, 0) 
    END as price,
    COALESCE(p.image_url, cp.image_url) as image_url,
    p.rarity,
    p.printing_id,
    p.stock,
    s.set_name::TEXT
  FROM products p
  LEFT JOIN card_printings cp ON p.printing_id = cp.printing_id
  LEFT JOIN sets s ON cp.set_id = s.set_id
  LEFT JOIN cards c ON cp.card_id = c.card_id
  LEFT JOIN aggregated_prices ap ON p.printing_id = ap.printing_id
  WHERE 
    p.stock > 0 -- Always show in-stock only
    -- Search
    AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%')
    -- Game Coarse Filter
    AND (
         v_game_code IS NULL 
         OR p.game = v_game_code
         OR (v_game_code = 'MTG' AND (p.game = 'Magic' OR p.game = '22'))
         OR (v_game_code = 'POKEMON' AND (p.game = 'Pokemon' OR p.game = '23'))
    )
    -- Set
    AND (set_filter IS NULL OR s.set_name = ANY(set_filter))
    -- Rarity
    AND (rarity_filter IS NULL OR LOWER(p.rarity) = ANY(rarity_filter))
    -- Colors
    AND (
      color_filter IS NULL 
      OR c.colors && color_filter
      OR ('C' = ANY(color_filter) AND (c.colors IS NULL OR array_length(c.colors, 1) IS NULL))
      OR ('M' = ANY(color_filter) AND array_length(c.colors, 1) > 1)
    )
    -- Type
    AND (type_filter IS NULL OR EXISTS (
        SELECT 1 FROM unnest(type_filter) AS t WHERE c.type_line ILIKE '%' || t || '%'
    ))
    -- Year Range
    AND (year_from IS NULL OR EXTRACT(YEAR FROM s.release_date) >= year_from)
    AND (year_to IS NULL OR EXTRACT(YEAR FROM s.release_date) <= year_to)
  ORDER BY
    -- PRIORITIZE EXACT MATCHES IF SEARCH IS PROVIDED
    CASE WHEN search_query IS NOT NULL AND p.name ILIKE search_query THEN 0 ELSE 1 END ASC,
    -- EXISTING SORTS
    CASE 
        WHEN v_sort_by = 'price_asc' THEN (CASE WHEN p.price > 0 THEN p.price ELSE COALESCE(ap.avg_market_price_usd, 0) END)
    END ASC,
    CASE 
        WHEN v_sort_by = 'price_desc' THEN (CASE WHEN p.price > 0 THEN p.price ELSE COALESCE(ap.avg_market_price_usd, 0) END)
    END DESC,
    CASE WHEN v_sort_by = 'newest' THEN p.created_at END DESC,
    CASE WHEN v_sort_by = 'name' THEN p.name END ASC,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Update add_to_cart to prevent exceeding stock limitation
CREATE OR REPLACE FUNCTION public.add_to_cart(p_printing_id text, p_quantity integer, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_cart_id uuid;
    v_product_id uuid;
    v_product_stock integer;
    v_existing_quantity integer;
    v_base_printing_id uuid;
    v_is_foil boolean := false;
    v_is_etched boolean := false;
    v_card_name text;
    v_price numeric;
    v_image_url text;
BEGIN
    -- Parse suffix to get base UUID and finish
    IF p_printing_id LIKE '%-foil' THEN
        v_base_printing_id := SUBSTRING(p_printing_id FROM 1 FOR LENGTH(p_printing_id) - 5)::uuid;
        v_is_foil := true;
    ELSIF p_printing_id LIKE '%-nonfoil' THEN
        v_base_printing_id := SUBSTRING(p_printing_id FROM 1 FOR LENGTH(p_printing_id) - 8)::uuid;
    ELSIF p_printing_id LIKE '%-etched' THEN
        v_base_printing_id := SUBSTRING(p_printing_id FROM 1 FOR LENGTH(p_printing_id) - 7)::uuid;
        v_is_etched := true;
    ELSE
        v_base_printing_id := p_printing_id::uuid;
    END IF;

    -- Look up real card details
    SELECT c.card_name, 
           cp.image_url
    INTO v_card_name, v_image_url
    FROM card_printings cp
    JOIN cards c ON cp.card_id = c.id
    WHERE cp.printing_id = v_base_printing_id LIMIT 1;
    
    -- If card not found at all, revert
    IF v_card_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Card not found in database');
    END IF;

    -- Fetch price separately to avoid complex joins failing
    SELECT avg_market_price_usd INTO v_price
    FROM aggregated_prices 
    WHERE printing_id = v_base_printing_id LIMIT 1;

    IF v_price IS NULL THEN v_price := 0; END IF;

    -- Append finish to name for clarity in cart
    IF v_is_etched THEN
        v_card_name := v_card_name || ' (Etched)';
    ELSIF v_is_foil THEN
        v_card_name := v_card_name || ' (Foil)';
    ELSE
        v_card_name := v_card_name;
    END IF;

    -- Check if Cart Exists
    SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;

    IF v_cart_id IS NULL THEN
        INSERT INTO carts (user_id) VALUES (p_user_id) RETURNING id INTO v_cart_id;
    END IF;

    -- Check if Product Exists matching this exact synthetic ID by name & printing_id combo
    SELECT id, stock INTO v_product_id, v_product_stock 
    FROM products 
    WHERE printing_id = v_base_printing_id AND name = v_card_name 
    LIMIT 1;

    -- If Product does not exist, auto-create it using REAL data
    IF v_product_id IS NULL THEN
        v_product_stock := 10;
        INSERT INTO products (printing_id, name, price, stock, game, image_url)
        VALUES (v_base_printing_id, v_card_name, v_price, v_product_stock, 'MTG', v_image_url) 
        RETURNING id INTO v_product_id;
    END IF;

    -- Check if Item already in Cart
    SELECT quantity INTO v_existing_quantity 
    FROM cart_items 
    WHERE cart_id = v_cart_id AND product_id = v_product_id;

    IF v_existing_quantity IS NOT NULL THEN
        IF (v_existing_quantity + p_quantity) > v_product_stock THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'message', 'No hay suficiente stock. (Stock: ' || v_product_stock || ', Carrito: ' || v_existing_quantity || ')'
            );
        END IF;

        UPDATE cart_items 
        SET quantity = v_existing_quantity + p_quantity 
        WHERE cart_id = v_cart_id AND product_id = v_product_id;
    ELSE
        IF p_quantity > v_product_stock THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'message', 'No hay suficiente stock. (Stock: ' || v_product_stock || ')'
            );
        END IF;

        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (v_cart_id, v_product_id, p_quantity);
    END IF;

    RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
