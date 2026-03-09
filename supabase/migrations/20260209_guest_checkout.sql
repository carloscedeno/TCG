-- Allow guest orders by making user_id nullable and adding guest_info
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_info JSONB;

-- Update the RPC to support guest checkout
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_user_id UUID,
    p_items JSONB,
    p_shipping_address JSONB,
    p_total_amount NUMERIC,
    p_guest_info JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
BEGIN
    -- Insert Order
    INSERT INTO public.orders (user_id, status, total_amount, shipping_address, guest_info)
    VALUES (p_user_id, 'pending_verification', p_total_amount, p_shipping_address, p_guest_info)
    RETURNING id INTO v_order_id;

    -- Insert Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (
            v_order_id, 
            (v_item->>'product_id')::TEXT, -- product_id is likely text/uuid
            (v_item->>'quantity')::INT, 
            (v_item->>'price')::NUMERIC
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;
