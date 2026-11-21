-- Migration: Security Hardening (Primera Pasada)
-- 1. Prevent privilege escalation on public.profiles (role column protection)
-- 2. Restrict public.orders and public.order_items SELECT RLS to owner/admin
-- 3. Add secure SECURITY DEFINER RPC get_order_tracking(uuid) for OrderTrackingPage
-- 4. Enforce server-side total_amount calculation & positive quantity check in create_order_atomic

-- ============================================================================
-- 1. PROFILES: Protect 'role' column from client-side self-escalation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Only allow role changes by service_role/postgres or an existing admin
        IF current_setting('role', true) NOT IN ('service_role', 'postgres', 'supabase_admin')
           AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Forbidden: cannot modify user role';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================================
-- 2. ORDERS & ORDER_ITEMS: Remove public SELECT * exposure
-- ============================================================================
DROP POLICY IF EXISTS "Public can track orders by ID" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or admins all" ON public.orders;
CREATE POLICY "Users can view own orders or admins all"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items or admins all" ON public.order_items;
CREATE POLICY "Users can view own order items or admins all"
    ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id
              AND (o.user_id = auth.uid() OR public.is_admin())
        )
    );

-- ============================================================================
-- 3. SECURE RPC FOR GUEST/UUID ORDER TRACKING
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'total_amount', o.total_amount,
        'status', o.status,
        'shipping_address', o.shipping_address,
        'guest_info', o.guest_info,
        'created_at', o.created_at,
        'odoo_order_id', o.odoo_order_id,
        'order_items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', oi.id,
                        'order_id', oi.order_id,
                        'product_id', oi.product_id,
                        'accessory_id', oi.accessory_id,
                        'product_name', oi.product_name,
                        'quantity', oi.quantity,
                        'price_at_purchase', oi.price_at_purchase,
                        'is_on_demand', oi.is_on_demand,
                        'finish', oi.finish,
                        'set_code', oi.set_code,
                        'products', CASE
                            WHEN p.id IS NOT NULL THEN jsonb_build_object(
                                'name', p.name,
                                'image_url', p.image_url,
                                'set_code', p.set_code,
                                'release_date', p.release_date
                            )
                            ELSE NULL
                        END,
                        'accessories', CASE
                            WHEN a.id IS NOT NULL THEN jsonb_build_object(
                                'name', a.name,
                                'image_url', a.image_url,
                                'category', a.category,
                                'category_code', a.category_code,
                                'release_date', a.release_date
                            )
                            ELSE NULL
                        END
                    )
                )
                FROM public.order_items oi
                LEFT JOIN public.products p ON p.id = oi.product_id
                LEFT JOIN public.accessories a ON a.id = oi.accessory_id
                WHERE oi.order_id = o.id
            ),
            '[]'::jsonb
        )
    )
    INTO v_result
    FROM public.orders o
    WHERE o.id = p_order_id;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(uuid) TO anon, authenticated;

-- ============================================================================
-- 4. CREATE_ORDER_ATOMIC: Enforce server-side total calculation & qty > 0
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id uuid,
    p_items jsonb,
    p_shipping_address jsonb,
    p_total_amount numeric,
    p_guest_info jsonb DEFAULT NULL,
    p_cart_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_cart_id uuid := p_cart_id;
    v_real_price numeric;
    v_item_price numeric;
    v_qty integer;
    v_calculated_total numeric := 0;
    v_current_stock integer;
    v_target_id uuid;
    v_acc_id uuid;
    v_is_on_demand boolean;
    v_product_name text;
    v_printing_id uuid;
    v_finish text;
    v_set_code text;
BEGIN
    INSERT INTO public.orders (
        user_id, 
        total_amount, 
        status, 
        shipping_address,
        guest_info,
        created_at
    )
    VALUES (
        p_user_id, 
        0, -- Will be overwritten with authoritative server-side total
        'pending_verification', 
        p_shipping_address,
        p_guest_info,
        now()
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := COALESCE((v_item->>'quantity')::integer, 0);
        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Cantidad inválida para el ítem';
        END IF;

        v_target_id := NULLIF(v_item->>'product_id', 'null')::uuid;
        v_acc_id := NULLIF(v_item->>'accessory_id', 'null')::uuid;
        v_is_on_demand := COALESCE((v_item->>'is_on_demand')::boolean, false);
        v_real_price := NULL;
        v_current_stock := NULL;
        v_product_name := NULL;
        v_printing_id := NULL;
        v_finish := NULL;
        v_set_code := NULL;

        -- A. Try as PRODUCT
        IF v_target_id IS NOT NULL THEN
            SELECT stock,
                CASE WHEN discount_end_date IS NOT NULL AND discount_end_date > now()
                     THEN ROUND(price * (1 - discount_percentage / 100.0), 2)
                     ELSE price
                END,
                name, printing_id, finish, set_code
            INTO v_current_stock, v_real_price, v_product_name, v_printing_id, v_finish, v_set_code
            FROM public.products
            WHERE id = v_target_id;

            IF v_current_stock IS NULL THEN
                SELECT stock, price, name
                INTO v_current_stock, v_real_price, v_product_name
                FROM public.accessories
                WHERE id = v_target_id;

                IF v_current_stock IS NOT NULL THEN
                    v_acc_id := v_target_id;
                    v_target_id := NULL;
                END IF;
            END IF;
        END IF;

        -- B. Try as ACCESSORY
        IF v_target_id IS NULL AND v_acc_id IS NOT NULL THEN
            SELECT stock, price, name
            INTO v_current_stock, v_real_price, v_product_name
            FROM public.accessories
            WHERE id = v_acc_id;
        END IF;

        -- C. Execute Insertion & Stock Decrement
        IF v_target_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            IF NOT v_is_on_demand AND v_current_stock < v_qty THEN
                v_is_on_demand := true;
            END IF;

            v_product_name := COALESCE(v_product_name, v_item->>'name', 'Producto sin nombre');
            v_printing_id := COALESCE(v_printing_id, NULLIF(v_item->>'printing_id', 'null')::uuid);
            v_finish := COALESCE(v_finish, v_item->>'finish', 'nonfoil');
            v_set_code := COALESCE(v_set_code, v_item->>'set', v_item->>'set_code');
            v_item_price := COALESCE(v_real_price, (v_item->>'price')::numeric, 0);

            INSERT INTO public.order_items (order_id, product_id, printing_id, product_name, quantity, price_at_purchase, is_on_demand, finish, set_code)
            VALUES (v_order_id, v_target_id, v_printing_id, v_product_name, v_qty, v_item_price, v_is_on_demand, v_finish, v_set_code);

            v_calculated_total := v_calculated_total + (v_item_price * v_qty);

            UPDATE public.products SET stock = GREATEST(0, stock - v_qty) WHERE id = v_target_id;

        ELSIF v_acc_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
            IF NOT v_is_on_demand AND v_current_stock < v_qty THEN
                v_is_on_demand := true;
            END IF;

            v_product_name := COALESCE(v_product_name, v_item->>'name', 'Accesorio sin nombre');
            v_item_price := COALESCE(v_real_price, (v_item->>'price')::numeric, 0);

            INSERT INTO public.order_items (order_id, accessory_id, product_name, quantity, price_at_purchase, is_on_demand)
            VALUES (v_order_id, v_acc_id, v_product_name, v_qty, v_item_price, v_is_on_demand);

            v_calculated_total := v_calculated_total + (v_item_price * v_qty);

            UPDATE public.accessories SET stock = GREATEST(0, stock - v_qty) WHERE id = v_acc_id;
        
        ELSE
            RAISE EXCEPTION 'Item de orden inválido o no encontrado: %', COALESCE(v_item->>'name', v_item->>'id');
        END IF;
    END LOOP;

    -- Overwrite order total with authoritative server-side calculation
    UPDATE public.orders SET total_amount = v_calculated_total WHERE id = v_order_id;

    IF v_cart_id IS NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id AND is_active = true LIMIT 1;
    END IF;

    IF v_cart_id IS NOT NULL THEN
        DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'total_amount', v_calculated_total
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, jsonb, jsonb, numeric, jsonb, uuid) TO anon, authenticated;
