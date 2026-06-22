-- Función RPC para calcular las variaciones de precio en el inventario de un usuario

CREATE OR REPLACE FUNCTION get_inventory_movements(p_user_id UUID)
RETURNS TABLE (
    printing_id UUID,
    condition_id INTEGER,
    card_name VARCHAR,
    set_code VARCHAR,
    previous_price DECIMAL,
    current_price DECIMAL,
    price_delta DECIMAL,
    last_updated TIMESTAMPTZ,
    quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.printing_id,
        uc.condition_id,
        c.card_name,
        cp.set_code,
        ph_prev.price_usd as previous_price,
        ph_latest.price_usd as current_price,
        (ph_latest.price_usd - ph_prev.price_usd) as price_delta,
        ph_latest.timestamp as last_updated,
        uc.quantity
    FROM user_collections uc
    JOIN card_printings cp ON uc.printing_id = cp.printing_id
    JOIN cards c ON cp.card_id = c.card_id
    LEFT JOIN LATERAL (
        SELECT price_usd, timestamp 
        FROM price_history 
        WHERE price_history.printing_id = uc.printing_id AND price_history.condition_id = uc.condition_id
        ORDER BY timestamp DESC 
        LIMIT 1
    ) ph_latest ON true
    LEFT JOIN LATERAL (
        SELECT price_usd 
        FROM price_history 
        WHERE price_history.printing_id = uc.printing_id AND price_history.condition_id = uc.condition_id
        ORDER BY timestamp DESC 
        OFFSET 1 LIMIT 1
    ) ph_prev ON true
    WHERE uc.user_id = p_user_id
      AND ph_latest.price_usd IS NOT NULL
      AND ph_prev.price_usd IS NOT NULL
      AND (ph_latest.price_usd - ph_prev.price_usd) != 0
    ORDER BY ABS(ph_latest.price_usd - ph_prev.price_usd) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
