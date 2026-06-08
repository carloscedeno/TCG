-- 1. Add geek_credits to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS geek_credits integer DEFAULT 0;

-- 2. Create credit_history table
CREATE TABLE IF NOT EXISTS public.credit_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. RLS for credit_history
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'credit_history' AND policyname = 'Users can view their own credit history'
    ) THEN
        CREATE POLICY "Users can view their own credit history"
        ON public.credit_history
        FOR SELECT
        USING ( auth.uid() = user_id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'credit_history' AND policyname = 'Admins can view all credit history'
    ) THEN
        CREATE POLICY "Admins can view all credit history"
        ON public.credit_history
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;
END
$$;

-- 4. RPC for admins to adjust credits
CREATE OR REPLACE FUNCTION admin_adjust_credits(target_user_id uuid, p_amount int, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_role text;
BEGIN
    -- Check if caller is admin
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
    
    IF v_admin_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied. Only administrators can adjust credits.';
    END IF;

    -- Update user credits
    UPDATE public.profiles 
    SET geek_credits = COALESCE(geek_credits, 0) + p_amount
    WHERE id = target_user_id;

    -- Insert history record
    INSERT INTO public.credit_history (user_id, admin_id, amount, reason)
    VALUES (target_user_id, auth.uid(), p_amount, p_reason);
END;
$$;
