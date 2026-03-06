-- Update get_products_stock_by_printing_ids to include name for version matching
CREATE OR REPLACE FUNCTION public.get_products_stock_by_printing_ids(p_printing_ids UUID[])
RETURNS TABLE (
  id UUID,
  printing_id UUID,
  stock INT,
  price NUMERIC,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.printing_id, p.stock, p.price, p.name
  FROM public.products p
  WHERE p.printing_id = ANY(p_printing_ids)
  AND p.stock > 0;
END;
$$;
