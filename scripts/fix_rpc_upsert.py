import psycopg2

try:
    conn = psycopg2.connect(
        user="postgres.sxuotvogwvmxuvwbsscv",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    cur = conn.cursor()
    
    # 1. Update the RPC definition
    cur.execute("""
    CREATE OR REPLACE FUNCTION public.upsert_product_inventory(
        p_printing_id uuid,
        p_price numeric,
        p_stock integer,
        p_condition text,
        p_finish text DEFAULT 'nonfoil'
    )
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_name TEXT;
        v_game TEXT;
        v_set_code TEXT;
        v_image_url TEXT;
        v_rarity TEXT;
    BEGIN
        -- 1. Fetch denormalized data
        SELECT 
            c.card_name,
            c.game_id,
            s.set_code,
            cp.image_url,
            cp.rarity
        INTO 
            v_name, v_game, v_set_code, v_image_url, v_rarity
        FROM public.card_printings cp
        JOIN public.cards c ON cp.card_id = c.card_id
        LEFT JOIN public.sets s ON cp.set_id = s.set_id
        WHERE cp.printing_id = p_printing_id;

        IF v_name IS NULL THEN
            RETURN json_build_object('error', 'Card printing not found');
        END IF;

        -- 2. Performance upsert matching the table unique constraint
        INSERT INTO public.products (
            printing_id, 
            condition, 
            finish,
            price, 
            stock, 
            name, 
            game, 
            set_code, 
            image_url, 
            rarity
        )
        VALUES (
            p_printing_id, 
            p_condition, 
            LOWER(COALESCE(p_finish, 'nonfoil')),
            p_price, 
            p_stock, 
            v_name, 
            v_game, 
            v_set_code, 
            v_image_url, 
            v_rarity
        )
        ON CONFLICT (printing_id, condition, finish) 
        DO UPDATE SET 
            stock = public.products.stock + EXCLUDED.stock,
            price = EXCLUDED.price,
            updated_at = NOW();

        RETURN json_build_object('success', true);
    END;
    $$;
    """)
    
    conn.commit()
    print("Successfully updated upsert_product_inventory RPC")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
