-- =============================================================================
-- EMERGENCY ROLLBACK (Entorno DEV)
-- =============================================================================
-- Este script revierte todos los cambios realizados durante la sesión de
-- integración de Accesorios y Banners.
-- =============================================================================

BEGIN;

-- 1. ELIMINACIÓN DE TABLAS NUEVAS
DROP TABLE IF EXISTS public.hero_banners CASCADE;
DROP TABLE IF EXISTS public.accessories CASCADE;

-- 2. REVERSIÓN DE COLUMNAS EN TABLAS EXISTENTES
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS accessory_id;
ALTER TABLE public.order_items DROP COLUMN IF EXISTS accessory_id;

-- 3. ELIMINACIÓN DE CONSTRAINTS ESPECÍFICOS
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_product_key;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_accessory_key;

-- 4. LIMPIEZA DE DATOS SEMILLA (Basados en IDs 0000...)
DELETE FROM public.products WHERE printing_id::text LIKE '0000%';
DELETE FROM public.card_printings WHERE printing_id::text LIKE '0000%';
DELETE FROM public.cards WHERE card_id::text LIKE '0000%';

-- 5. ELIMINACIÓN DE FUNCIONES RPC NUEVAS
DROP FUNCTION IF EXISTS public.add_accessory_to_cart_v1(uuid, integer, uuid);
DROP FUNCTION IF EXISTS public.search_card_names(text, integer);

-- 6. RESTAURACIÓN DE FUNCIONES ORIGINALES (Simplificadas)
-- Revertimos get_user_cart a su estado sin accesorios
CREATE OR REPLACE FUNCTION public.get_user_cart(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id uuid;
    v_items jsonb;
BEGIN
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
    
    SELECT jsonb_agg(item_row) INTO v_items
    FROM (
        SELECT 
            ci.id as cart_item_id, ci.product_id, ci.quantity,
            p.name, p.price, p.image_url, p.set_code, p.stock, p.finish
        FROM public.cart_items ci
        JOIN public.products p ON ci.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    ) item_row;

    RETURN jsonb_build_object('id', v_cart_id, 'items', COALESCE(v_items, '[]'::jsonb));
END;
$$;

COMMIT;

-- 7. REFRESCAR VISTA (Si existe)
-- Si la vista fue creada con INNER JOINs que fallan, la recreamos de forma básica
-- o la dejamos para que un sync posterior la repare.
DROP MATERIALIZED VIEW IF EXISTS public.mv_unique_cards CASCADE;

-- Informar al usuario
DO $$ BEGIN RAISE NOTICE 'Rollback completado. El entorno DEV ha sido limpiado.'; END $$;
