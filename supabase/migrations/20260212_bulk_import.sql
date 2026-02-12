-- Function to perform bulk inventory import
CREATE OR REPLACE FUNCTION bulk_import_inventory(
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_printing_id UUID;
    v_imported_count INTEGER := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_failed_indices INTEGER[] := ARRAY[]::INTEGER[];
    v_index INTEGER := 0;
    v_card_name TEXT;
    v_set_code TEXT;
    v_collector_num TEXT;
    v_quantity INTEGER;
    v_price NUMERIC;
    v_condition TEXT;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            v_card_name := v_item->>'name';
            v_set_code := v_item->>'set';
            v_collector_num := v_item->>'collector_number';
            v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 1);
            v_price := COALESCE((v_item->>'price')::NUMERIC, 0);
            v_condition := COALESCE(v_item->>'condition', 'NM');

            IF v_card_name IS NULL THEN
                v_errors := array_append(v_errors, 'Row ' || (v_index + 1) || ': Missing card name');
                v_failed_indices := array_append(v_failed_indices, v_index);
                v_index := v_index + 1;
                CONTINUE;
            END IF;

            -- Look up card_printing
            -- Priority 1: Name + Set + Collector Number
            -- Priority 2: Name + Set
            -- Priority 3: Name only (optional, but current logic does it)
            
            SELECT cp.printing_id INTO v_printing_id
            FROM card_printings cp
            JOIN cards c ON cp.card_id = c.card_id
            WHERE c.card_name ILIKE v_card_name
              AND (v_set_code IS NULL OR cp.set_code ILIKE v_set_code OR EXISTS (SELECT 1 FROM sets s WHERE s.set_id = cp.set_id AND s.set_code ILIKE v_set_code))
              AND (v_collector_num IS NULL OR cp.collector_number = v_collector_num)
            LIMIT 1;

            IF v_printing_id IS NULL THEN
                v_errors := array_append(v_errors, 'Row ' || (v_index + 1) || ' (' || v_card_name || '): Card not found in database');
                v_failed_indices := array_append(v_failed_indices, v_index);
            ELSE
                -- Use the existing upsert logic or inline it for speed
                INSERT INTO public.products (printing_id, price, stock, condition)
                VALUES (v_printing_id, v_price, v_quantity, v_condition)
                ON CONFLICT (printing_id, condition) 
                DO UPDATE SET 
                    price = EXCLUDED.price,
                    stock = public.products.stock + EXCLUDED.stock,
                    updated_at = now();
                
                v_imported_count := v_imported_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_errors := array_append(v_errors, 'Row ' || (v_index + 1) || ' (' || v_card_name || '): Unexpected error - ' || SQLERRM);
            v_failed_indices := array_append(v_failed_indices, v_index);
        END;
        v_index := v_index + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'imported_count', v_imported_count,
        'total_rows', jsonb_array_length(p_items),
        'errors', v_errors,
        'failed_indices', v_failed_indices
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
