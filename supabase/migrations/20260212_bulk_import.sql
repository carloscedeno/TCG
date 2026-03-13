-- Function to perform bulk inventory import
-- Enhanced with Foil support and high-performance bulk logic
CREATE OR REPLACE FUNCTION bulk_import_inventory(
    p_items JSONB,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_imported_count INTEGER := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_failed_indices INTEGER[] := ARRAY[]::INTEGER[];
    v_total_rows INTEGER;
BEGIN
    v_total_rows := jsonb_array_length(p_items);

    -- 1. Create a temp table with all required metadata for products table
    CREATE TEMP TABLE import_mapping ON COMMIT DROP AS
    WITH input_data AS (
        SELECT 
            (elem->>'name')::TEXT as name,
            (elem->>'set_code')::TEXT as set_code,
            (elem->>'collector_number')::TEXT as collector_number,
            (elem->>'scryfall_id')::TEXT as scryfall_id,
            CASE 
                WHEN (elem->>'quantity') ~ '^[0-9]+$' THEN (elem->>'quantity')::INTEGER
                ELSE 1
            END as quantity,
            CASE 
                WHEN (elem->>'price') ~ '^[0-9.]+$' THEN (elem->>'price')::NUMERIC
                ELSE 0
            END as price,
            COALESCE((elem->>'condition')::TEXT, 'NM') as condition,
            LOWER(COALESCE(elem->>'finish', 'nonfoil')) as finish,
            (idx - 1)::INTEGER as original_index
        FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(elem, idx)
    ),
    matched_by_id AS (
        -- Level 0: High accuracy match via Scryfall ID
        SELECT 
            id.original_index,
            cp.printing_id,
            c.card_name as db_card_name,
            cp.set_code as db_set_code,
            COALESCE(cp.image_url_normal, cp.image_url) as db_image_url,
            cp.rarity as db_rarity,
            cp.is_foil,
            cp.released_at,
            0 as match_priority
        FROM input_data id
        JOIN card_printings cp ON id.scryfall_id IS NOT NULL 
            AND id.scryfall_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
            AND cp.scryfall_id = id.scryfall_id::UUID
        LEFT JOIN cards c ON cp.card_id = c.card_id
    ),
    matched_by_name_strict AS (
        -- Level 1: Strict match via Name + Set + Collector Number
        -- Supports DFC (Double Faced Cards) where name matches front part
        SELECT 
            id.original_index,
            cp.printing_id,
            c.card_name as db_card_name,
            cp.set_code as db_set_code,
            COALESCE(cp.image_url_normal, cp.image_url) as db_image_url,
            cp.rarity as db_rarity,
            cp.is_foil,
            cp.released_at,
            1 as match_priority
        FROM input_data id
        JOIN cards c ON id.name IS NOT NULL AND (
            LOWER(c.card_name) = LOWER(id.name) OR 
            LOWER(c.card_name) LIKE (LOWER(id.name) || ' // %')
        )
        JOIN card_printings cp ON cp.card_id = c.card_id
            AND id.set_code IS NOT NULL AND LOWER(cp.set_code) = LOWER(id.set_code)
            AND id.collector_number IS NOT NULL AND cp.collector_number = id.collector_number
    ),
    matched_by_name_partial AS (
        -- Level 2: Partial match via Name + Set (fallback for cases without collector number)
        SELECT 
            id.original_index,
            cp.printing_id,
            c.card_name as db_card_name,
            cp.set_code as db_set_code,
            COALESCE(cp.image_url_normal, cp.image_url) as db_image_url,
            cp.rarity as db_rarity,
            cp.is_foil,
            cp.released_at,
            2 as match_priority
        FROM input_data id
        JOIN cards c ON id.name IS NOT NULL AND (
            LOWER(c.card_name) = LOWER(id.name) OR 
            LOWER(c.card_name) LIKE (LOWER(id.name) || ' // %')
        )
        JOIN card_printings cp ON cp.card_id = c.card_id
            AND id.set_code IS NOT NULL AND LOWER(cp.set_code) = LOWER(id.set_code)
            AND id.collector_number IS NULL
    ),
    all_matches AS (
        SELECT * FROM matched_by_id
        UNION ALL
        SELECT * FROM matched_by_name_strict
        UNION ALL
        SELECT * FROM matched_by_name_partial
    ),
    best_matches AS (
        SELECT DISTINCT ON (original_index)
            m.*,
            id.finish as requested_finish
        FROM all_matches m
        JOIN input_data id ON m.original_index = id.original_index
        ORDER BY 
            m.original_index,
            m.match_priority,
            CASE 
                WHEN id.finish = 'foil' AND m.is_foil = true THEN 0
                WHEN id.finish = 'nonfoil' AND m.is_foil = false THEN 0
                ELSE 1
            END ASC,
            m.released_at DESC
    )
    SELECT 
        id.*, 
        bm.printing_id, 
        bm.db_card_name, 
        bm.db_set_code, 
        bm.db_image_url, 
        bm.db_rarity
    FROM input_data id
    LEFT JOIN best_matches bm ON id.original_index = bm.original_index;

    -- 2. Aggregate counts for duplicate (printing_id, condition, finish) pairs to avoid ON CONFLICT errors
    WITH aggregated_data AS (
        SELECT 
            printing_id,
            MAX(COALESCE(db_card_name, name)) as name,
            MAX(db_set_code) as set_code,
            MAX(price) as price,
            SUM(quantity) as stock,
            condition,
            finish,
            MAX(db_image_url) as image_url,
            MAX(db_rarity) as rarity
        FROM import_mapping
        WHERE printing_id IS NOT NULL
        GROUP BY 
            printing_id, 
            condition,
            finish
    ),
    upserted AS (
        INSERT INTO public.products (
            printing_id, 
            name, 
            game, 
            set_code, 
            price, 
            stock, 
            condition,
            finish,
            image_url, 
            rarity
        )
        SELECT 
            a.printing_id, 
            a.name,
            '22', -- Magic: The Gathering
            a.set_code,
            a.price, 
            a.stock, 
            a.condition,
            a.finish,
            a.image_url,
            a.rarity
        FROM aggregated_data a
        ON CONFLICT (printing_id, condition, finish) 
        DO UPDATE SET 
            stock = public.products.stock + EXCLUDED.stock,
            price = CASE WHEN EXCLUDED.price > 0 THEN EXCLUDED.price ELSE public.products.price END,
            updated_at = now()
        RETURNING 1
    )
    SELECT count(*) INTO v_imported_count FROM upserted;

    -- 3. Collect errors for missing cards
    SELECT 
        ARRAY_AGG('Row ' || (original_index + 1) || ' (' || COALESCE(name, 'Unknown') || '): Card not found'),
        ARRAY_AGG(original_index)
    INTO v_errors, v_failed_indices
    FROM import_mapping
    WHERE printing_id IS NULL;

    RETURN jsonb_build_object(
        'imported_count', COALESCE(v_imported_count, 0),
        'total_rows', v_total_rows,
        'errors', COALESCE(v_errors, ARRAY[]::TEXT[]),
        'failed_indices', COALESCE(v_failed_indices, ARRAY[]::INTEGER[])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

