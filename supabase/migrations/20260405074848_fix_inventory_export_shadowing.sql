-- RPC for Inventory Export (v1) - FIXED (out_ prefix to avoid shadowing)
DROP FUNCTION IF EXISTS public.get_inventory_for_export();

CREATE OR REPLACE FUNCTION public.get_inventory_for_export()
RETURNS TABLE (
    out_name text,
    out_set_code text,
    out_collector text,
    out_condition text,
    out_finish text,
    out_qty integer
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.name as out_name,
        p.set_code as out_set_code,
        cp.collector_number::text as out_collector,
        p.condition as out_condition,
        p.finish as out_finish,
        p.stock as out_qty
    FROM public.products p
    LEFT JOIN public.card_printings cp ON p.printing_id = cp.printing_id
    WHERE p.stock > 0
    ORDER BY p.name ASC, p.set_code ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_for_export() TO anon;
GRANT EXECUTE ON FUNCTION public.get_inventory_for_export() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_for_export() TO service_role;
