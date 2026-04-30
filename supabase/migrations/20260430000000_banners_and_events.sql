-- Migration: Add events table and ensure hero_banners is ready
-- Date: 2026-04-30

-- 1. Events Table (New)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    game_code TEXT REFERENCES public.games(game_code) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL,
    format TEXT,
    entry_fee TEXT,
    registered INTEGER DEFAULT 0,
    capacity INTEGER,
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS for Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Events
-- Public can view active events
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public can view active events" ON public.events;
    CREATE POLICY "Public can view active events" ON public.events
        FOR SELECT USING (is_active = true);

    -- Admins can do everything
    DROP POLICY IF EXISTS "Admins have full access to events" ON public.events;
    CREATE POLICY "Admins have full access to events" ON public.events
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.is_admin = true
            )
        );
END $$;

-- 4. Ensure hero_banners policies use is_admin from profiles
DO $$ 
BEGIN
    -- Update existing hero_banners policy if needed
    DROP POLICY IF EXISTS "Admin Full Access Banners" ON public.hero_banners;
    CREATE POLICY "Admin Full Access Banners" ON public.hero_banners
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.is_admin = true
            )
        );
END $$;

-- 5. Updated at trigger for events
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
