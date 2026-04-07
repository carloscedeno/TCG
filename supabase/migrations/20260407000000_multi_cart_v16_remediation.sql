-- Multi-Cart Remediation Migration (Terminal v16)
-- Target: Unify cart management and fix visibility issues for admins.

-- 1. Ensure schema consistency for public.carts
DO $$ 
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'carts' AND COLUMN_NAME = 'name') THEN
        ALTER TABLE public.carts ADD COLUMN name text DEFAULT 'Carrito Principal';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'carts' AND COLUMN_NAME = 'is_active') THEN
        ALTER TABLE public.carts ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;

-- Fix legacy data: ensure at least one cart is active if any exist
UPDATE public.carts 
SET is_active = true 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY updated_at DESC) as rn
        FROM public.carts
    ) t WHERE rn = 1
) AND NOT EXISTS (SELECT 1 FROM public.carts c2 WHERE c2.user_id = public.carts.user_id AND c2.is_active = true);

-- 2. Define robust RPC for listing available carts
DROP FUNCTION IF EXISTS public.list_user_carts();
CREATE OR REPLACE FUNCTION public.list_user_carts()
RETURNS TABLE (
    id uuid,
    name text,
    is_active boolean,
    item_count bigint,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.is_active,
        COALESCE(SUM(ci.quantity), 0)::bigint as item_count,
        c.updated_at
    FROM public.carts c
    LEFT JOIN public.cart_items ci ON c.id = ci.cart_id
    WHERE c.user_id = auth.uid()
    GROUP BY c.id, c.name, c.is_active, c.updated_at
    ORDER BY c.is_active DESC, c.updated_at DESC;
END;
$$;

-- 3. Define RPC to create a new named cart
DROP FUNCTION IF EXISTS public.create_named_cart(text);
CREATE OR REPLACE FUNCTION public.create_named_cart(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_cart_id uuid;
BEGIN
    UPDATE public.carts 
    SET is_active = false 
    WHERE user_id = auth.uid();

    INSERT INTO public.carts (user_id, name, is_active)
    VALUES (auth.uid(), p_name, true)
    RETURNING id INTO v_new_cart_id;

    RETURN v_new_cart_id;
END;
$$;

-- 4. Define RPC to switch active cart
DROP FUNCTION IF EXISTS public.switch_active_cart(uuid);
CREATE OR REPLACE FUNCTION public.switch_active_cart(p_cart_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.carts WHERE id = p_cart_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Cart not found or not owned by current user';
    END IF;

    UPDATE public.carts 
    SET is_active = false 
    WHERE user_id = auth.uid();

    UPDATE public.carts 
    SET is_active = true 
    WHERE id = p_cart_id;
END;
$$;

-- 5. Define RPC to get active cart id (internal helper)
DROP FUNCTION IF EXISTS public.get_or_create_active_cart();
CREATE OR REPLACE FUNCTION public.get_or_create_active_cart()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
BEGIN
    SELECT id INTO v_cart_id 
    FROM public.carts 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        SELECT id INTO v_cart_id FROM public.carts WHERE user_id = auth.uid() LIMIT 1;
        
        IF v_cart_id IS NOT NULL THEN
            UPDATE public.carts SET is_active = true WHERE id = v_cart_id;
        ELSE
            INSERT INTO public.carts (user_id, name, is_active)
            VALUES (auth.uid(), 'Carrito Principal', true)
            RETURNING id INTO v_cart_id;
        END IF;
    END IF;

    RETURN v_cart_id;
END;
$$;

-- 6. Define main get_user_cart RPC (used by frontend)
DROP FUNCTION IF EXISTS public.get_user_cart(uuid);
CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
RETURNS SETOF public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
BEGIN
    -- Ignore p_user_id and use auth.uid() for security, 
    -- but keep parameter for frontend compatibility.
    
    SELECT id INTO v_cart_id 
    FROM public.carts 
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;

    IF v_cart_id IS NOT NULL THEN
        RETURN QUERY SELECT * FROM public.cart_items WHERE cart_id = v_cart_id;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.list_user_carts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_named_cart(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_active_cart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_active_cart() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cart(uuid) TO authenticated;
