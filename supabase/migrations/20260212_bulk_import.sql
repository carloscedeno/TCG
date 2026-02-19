-- Function to perform bulk inventory import
-- Enhanced with Foil support and high-performance bulk logic
CREATE OR REPLACE FUNCTION bulk_import_inventory(
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_imported_count INTEGER := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_failed_indices INTEGER[] := ARRAY[]::INTEGER[];
    v_total_rows INTEGER;
BEGIN
    v_total_rows := jsonb_array_length(p_items);

    -- 1. Create a temp table to map input data to printing_ids
    CREATE TEMP TABLE import_mapping ON COMMIT DROP AS
    WITH input_data AS (
        SELECT 
            (elem->>'name')::TEXT as name,
            (elem->>'set')::TEXT as set_code,
            (elem->>'collector_number')::TEXT as collector_number,
            COALESCE((elem->>'quantity')::INTEGER, 1) as quantity,
            COALESCE((elem->>'price')::NUMERIC, 0) as price,
            COALESCE((elem->>'condition')::TEXT, 'NM') as condition,
            LOWER(COALESCE(elem->>'finish', 'nonfoil')) as finish,
            (ordinality - 1)::INTEGER as original_index
        FROM jsonb_array_elements(p_items) WITH ORDINALITY elem
    ),
    target_printings AS (
        SELECT DISTINCT ON (id.original_index)
            id.*,
            cp.printing_id
        FROM input_data id
        LEFT JOIN cards c ON LOWER(c.card_name) = LOWER(id.name)
        LEFT JOIN card_printings cp ON cp.card_id = c.card_id 
            AND (id.set_code IS NULL OR LOWER(cp.set_code) = LOWER(id.set_code))
            AND (id.collector_number IS NULL OR cp.collector_number = id.collector_number)
        WHERE id.name IS NOT NULL
        ORDER BY 
            id.original_index,
            -- Prioritization logic for finish
            CASE 
                WHEN id.finish = 'foil' AND cp.is_foil = true THEN 0
                WHEN id.finish = 'nonfoil' AND cp.is_foil = false THEN 0
                WHEN id.finish = 'foil' AND cp.is_foil = false THEN 1 -- Fallback to non-foil if foil not found
                ELSE 2
            END ASC,
            cp.released_at DESC
    )
    SELECT * FROM target_printings;

    -- 2. Perform the bulk UPSERT into products
    WITH upserted AS (
        INSERT INTO public.products (printing_id, price, stock, condition)
        SELECT 
            m.printing_id, 
            m.price, 
            m.quantity, 
            m.condition
        FROM import_mapping m
        WHERE m.printing_id IS NOT NULL
        ON CONFLICT (printing_id, condition) 
        DO UPDATE SET 
            price = CASE WHEN EXCLUDED.price > 0 THEN EXCLUDED.price ELSE public.products.price END,
            stock = public.products.stock + EXCLUDED.stock,
            updated_at = now()
        RETURNING 1
    )
    SELECT count(*) INTO v_imported_count FROM upserted;

    -- 3. Collect errors for missing cards
    SELECT 
        ARRAY_AGG('Row ' || (original_index + 1) || ' (' || name || '): Card not found in database'),
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
