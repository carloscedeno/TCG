-- Add constraint to prevent duplicate products with same condition
ALTER TABLE products 
ADD CONSTRAINT products_printing_id_condition_key UNIQUE (printing_id, condition);

-- Function to upsert product inventory
CREATE OR REPLACE FUNCTION upsert_product_inventory(
    p_printing_id UUID,
    p_price NUMERIC,
    p_stock INTEGER,
    p_condition TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.products (printing_id, price, stock, condition)
    VALUES (p_printing_id, p_price, p_stock, p_condition)
    ON CONFLICT (printing_id, condition) 
    DO UPDATE SET 
        price = EXCLUDED.price,
        stock = public.products.stock + EXCLUDED.stock, -- Add to existing stock
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory list with details
CREATE OR REPLACE FUNCTION get_inventory_list(
    p_page INTEGER DEFAULT 0,
    p_page_size INTEGER DEFAULT 50,
    p_search TEXT DEFAULT NULL,
    p_set_id TEXT DEFAULT NULL -- set_id is usually text/uuid, assuming consistent with card_sets
) RETURNS TABLE (
    product_id UUID,
    stock INTEGER,
    price NUMERIC,
    condition TEXT,
    card_name TEXT,
    set_name TEXT,
    set_code TEXT,
    image_url TEXT,
    printing_id UUID
) AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := p_page * p_page_size;

    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.stock,
        p.price,
        p.condition,
        c.card_name as card_name,
        s.set_name as set_name,
        s.set_code as set_code,
        cp.image_url,
        p.printing_id
    FROM products p
    JOIN card_printings cp ON p.printing_id = cp.printing_id
    JOIN cards c ON cp.card_id = c.card_id
    JOIN sets s ON cp.set_id = s.set_id
    WHERE 
        (p_search IS NULL OR c.card_name ILIKE '%' || p_search || '%')
        AND (p_set_id IS NULL OR s.set_id::text = p_set_id) -- Cast to text just in case
    ORDER BY p.updated_at DESC, c.card_name ASC
    LIMIT p_page_size OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;
