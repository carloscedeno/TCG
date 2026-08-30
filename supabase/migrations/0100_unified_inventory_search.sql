-- Update search_card_names RPC to search across products (singles), accessories, and cards catalog
CREATE OR REPLACE FUNCTION public.search_card_names(query_text text, limit_count integer DEFAULT 10)
 RETURNS TABLE(card_name text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    WITH matches AS (
        SELECT p.name, 1 as priority FROM public.products p WHERE p.name ILIKE query_text || '%'
        UNION ALL
        SELECT a.name, 1 as priority FROM public.accessories a WHERE a.name ILIKE query_text || '%' AND (a.is_active IS NULL OR a.is_active = true)
        UNION ALL
        SELECT c.card_name as name, 2 as priority FROM public.cards c WHERE c.card_name ILIKE query_text || '%'
        UNION ALL
        SELECT p.name, 3 as priority FROM public.products p WHERE p.name ILIKE '%' || query_text || '%' AND p.name NOT ILIKE query_text || '%'
        UNION ALL
        SELECT a.name, 3 as priority FROM public.accessories a WHERE a.name ILIKE '%' || query_text || '%' AND a.name NOT ILIKE query_text || '%' AND (a.is_active IS NULL OR a.is_active = true)
    ),
    grouped AS (
        SELECT m.name, MIN(m.priority) as min_priority
        FROM matches m
        GROUP BY m.name
    )
    SELECT g.name::TEXT
    FROM grouped g
    ORDER BY g.min_priority ASC, g.name ASC
    LIMIT limit_count;
END;
$function$;
