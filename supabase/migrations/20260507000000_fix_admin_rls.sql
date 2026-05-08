-- Migration: Fix admin RLS policies to use role='admin'
-- Date: 2026-05-07

-- 1. Ensure role column exists in public.profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT;
    END IF;
END $$;

-- 2. Update existing admin policies for hero_banners
DO $$
BEGIN
    -- Drop old admin policy
    DROP POLICY IF EXISTS "Admin Full Access Banners" ON public.hero_banners;
    -- Create new admin policy using role
    CREATE POLICY "Admin Full Access Banners" ON public.hero_banners
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        );
END $$;

-- 3. (Optional) Update any other tables with is_admin policies here
-- Example for events (if needed)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
    CREATE POLICY "Admins have full access to events" ON public.events
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        );
END $$;

-- 4. Ensure RLS is enabled (already should be)
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. Backfill role for existing admin users
-- We only do this if is_admin column exists to avoid errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        UPDATE public.profiles SET role = 'admin' WHERE is_admin = true AND role IS NULL;
        UPDATE public.profiles SET role = 'user' WHERE (is_admin = false OR is_admin IS NULL) AND role IS NULL;
    END IF;
END $$;

COMMIT;
