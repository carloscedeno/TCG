-- Function for autocomplete search
CREATE OR REPLACE FUNCTION search_card_names(query_text TEXT, limit_count INT DEFAULT 10)
RETURNS TABLE (card_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT c.card_name
    FROM cards c
    WHERE c.card_name ILIKE query_text || '%'
    ORDER BY c.card_name
    LIMIT limit_count;
END;
$$;
