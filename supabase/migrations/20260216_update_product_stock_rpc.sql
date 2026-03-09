-- Migration: Create update_product_stock RPC
-- Description: Allows admin to manually update product stock
-- Date: 2026-02-16

CREATE OR REPLACE FUNCTION public.update_product_stock(
    p_product_id uuid,
    p_new_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_is_admin boolean;
BEGIN
    -- Check if user is admin (simple check, adjust based on actual role management)
    -- Assuming usage of public.profiles(role) or similar from previous context
    SELECT (role = 'admin') INTO v_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    UPDATE public.products
    SET stock = p_new_quantity
    WHERE id = p_product_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found');
    END IF;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.update_product_stock(uuid, integer) TO authenticated;
