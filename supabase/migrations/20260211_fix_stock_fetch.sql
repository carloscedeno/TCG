-- RPC to safely fetch product stock for a list of printing IDs (avoids URL length limits of GET requests)
CREATE OR REPLACE FUNCTION public.get_products_stock_by_printing_ids(p_printing_ids UUID[])
RETURNS TABLE (
  id UUID,
  printing_id UUID,
  stock INT,
  price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.printing_id, p.stock, p.price
  FROM public.products p
  WHERE p.printing_id = ANY(p_printing_ids)
  AND p.stock > 0;
END;
$$;
