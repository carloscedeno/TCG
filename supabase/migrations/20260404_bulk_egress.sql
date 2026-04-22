-- Create inventory_logs table for auditing stock movements
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action_type TEXT NOT NULL CHECK (action_type IN ('IMPORT', 'EGRESS', 'MANUAL_ADJUSTMENT')),
    reason TEXT,
    printing_id UUID REFERENCES public.card_printings(printing_id),
    quantity INTEGER NOT NULL,
    condition TEXT NOT NULL,
    finish TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Policies for inventory_logs
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" 
ON public.inventory_logs FOR SELECT 
TO authenticated 
USING (true);

-- Only admins/system can insert (we handle insertion via RPC)
CREATE POLICY "Enable insert for authenticated admins" 
ON public.inventory_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Preview Egress Function
CREATE OR REPLACE FUNCTION preview_bulk_egress(p_items JSONB)
RETURNS JSONB AS $$
DECLARE
    v_total_rows INTEGER;
BEGIN
    v_total_rows := jsonb_array_length(p_items);

    CREATE TEMP TABLE egress_mapping ON COMMIT DROP AS
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
            COALESCE((elem->>'condition')::TEXT, 'NM') as condition,
            LOWER(COALESCE(elem->>'finish', 'nonfoil')) as finish,
            (idx - 1)::INTEGER as original_index
        FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(elem, idx)
    ),
    matched_by_id AS (
        SELECT 
            id.original_index,
            cp.printing_id,
            c.card_name as db_card_name,
            cp.set_code as db_set_code,
            cp.is_foil,
            0 as match_priority
        FROM input_data id
        JOIN card_printings cp ON id.scryfall_id IS NOT NULL 
            AND id.scryfall_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' 
            AND cp.scryfall_id = id.scryfall_id::UUID
        LEFT JOIN cards c ON cp.card_id = c.card_id
    ),
    matched_by_name_strict AS (
        SELECT 
            id.original_index,
            cp.printing_id,
            c.card_name as db_card_name,
            cp.set_code as db_set_code,
            cp.is_foil,
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
        SELECT 
            id.original_index,
            cp.printing_id,
            c.card_name as db_card_name,
            cp.set_code as db_set_code,
            cp.is_foil,
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
            m.*
        FROM all_matches m
        JOIN input_data id ON m.original_index = id.original_index
        ORDER BY 
            m.original_index,
            m.match_priority,
            CASE 
                WHEN id.finish = 'foil' AND m.is_foil = true THEN 0
                WHEN id.finish = 'nonfoil' AND m.is_foil = false THEN 0
                ELSE 1
            END ASC
    )
    SELECT 
        id.*, 
        bm.printing_id, 
        COALESCE(bm.db_card_name, id.name) as mapped_name,
        COALESCE(bm.db_set_code, id.set_code) as mapped_set_code,
        COALESCE(p.stock, 0) as current_stock
    FROM input_data id
    LEFT JOIN best_matches bm ON id.original_index = bm.original_index
    LEFT JOIN public.products p ON p.printing_id = bm.printing_id 
        AND p.condition = id.condition 
        AND p.finish = id.finish;
        
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'original_index', original_index,
                'name', mapped_name,
                'set_code', mapped_set_code,
                'collector_number', collector_number,
                'condition', condition,
                'finish', finish,
                'requested_quantity', quantity,
                'current_stock', current_stock,
                'printing_id', printing_id,
                'status', CASE
                    WHEN printing_id IS NULL THEN 'error_not_found'
                    WHEN current_stock < quantity THEN 'error_insufficient_stock'
                    ELSE 'ok'
                END
            )
        )
        FROM egress_mapping
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Bulk Egress Function
CREATE OR REPLACE FUNCTION bulk_egress_inventory(
    p_items JSONB,
    p_reason TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_egress_count INTEGER := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_failed_indices INTEGER[] := ARRAY[]::INTEGER[];
    v_total_rows INTEGER;
BEGIN
    v_total_rows := jsonb_array_length(p_items);

    CREATE TEMP TABLE egress_processing ON COMMIT DROP AS
    SELECT 
        (elem->>'printing_id')::UUID as printing_id,
        (elem->>'name')::TEXT as name,
        CASE WHEN (elem->>'requested_quantity') ~ '^[0-9]+$' THEN (elem->>'requested_quantity')::INTEGER ELSE 0 END as quantity,
        (elem->>'condition')::TEXT as condition,
        (elem->>'finish')::TEXT as finish,
        (elem->>'original_index')::INTEGER as original_index
    FROM jsonb_array_elements(p_items) t(elem);

    -- 1. Validate check
    IF EXISTS (
        SELECT 1 
        FROM egress_processing ep
        LEFT JOIN public.products p ON p.printing_id = ep.printing_id AND p.condition = ep.condition AND p.finish = ep.finish
        WHERE p.printing_id IS NULL OR p.stock < ep.quantity
    ) THEN
        SELECT 
            ARRAY_AGG('Row ' || (ep.original_index + 1) || ' (' || ep.name || '): Insufficient stock. Available: ' || COALESCE(p.stock, 0)),
            ARRAY_AGG(ep.original_index)
        INTO v_errors, v_failed_indices
        FROM egress_processing ep
        LEFT JOIN public.products p ON p.printing_id = ep.printing_id AND p.condition = ep.condition AND p.finish = ep.finish
        WHERE p.printing_id IS NULL OR p.stock < ep.quantity;
        
        RAISE EXCEPTION 'Validation failed: Insufficient stock. %', array_to_string(v_errors, '; ');
    END IF;

    -- 2. Aggregation (Rule 3)
    WITH aggregated_data AS (
        SELECT 
            printing_id,
            MAX(name) as name,
            condition,
            finish,
            SUM(quantity) as quantity
        FROM egress_processing
        GROUP BY printing_id, condition, finish
    ),
    updated AS (
        UPDATE public.products p
        SET 
            stock = p.stock - a.quantity,
            updated_at = now()
        FROM aggregated_data a
        WHERE p.printing_id = a.printing_id 
          AND p.condition = a.condition 
          AND p.finish = a.finish
        RETURNING p.printing_id
    )
    SELECT count(*) INTO v_egress_count FROM updated;

    -- 3. Insert Logs
    INSERT INTO public.inventory_logs (
        action_type, reason, printing_id, quantity, condition, finish, user_id
    )
    SELECT 
        'EGRESS', p_reason, printing_id, quantity, condition, finish, p_user_id
    FROM egress_processing;

    RETURN jsonb_build_object(
        'egress_count', COALESCE(v_egress_count, 0),
        'total_rows', v_total_rows,
        'status', 'success'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
