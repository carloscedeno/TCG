-- NEW RPC for Inventory Export (v1)
CREATE OR REPLACE FUNCTION public.get_inventory_for_export()
RETURNS TABLE (
    name text,
    set_code text,
    collector text,
    condition text,
    finish text,
    qty integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name,
        p.set_code,
        cp.collector_number as collector,
        p.condition,
        p.finish,
        p.stock as qty
    FROM public.products p
    LEFT JOIN public.card_printings cp ON p.printing_id = cp.printing_id
    WHERE p.stock > 0
    ORDER BY p.name ASC, p.set_code ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_for_export() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_for_export() TO service_role;
