-- Migration: Add presale_banners table
-- Date: 2026-05-07

CREATE TABLE IF NOT EXISTS public.presale_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presale_banners ENABLE ROW LEVEL SECURITY;

-- Policies for Presale Banners
DO $$ 
BEGIN
    -- Public can view active presale banners
    DROP POLICY IF EXISTS "Public can view active presales" ON public.presale_banners;
    CREATE POLICY "Public can view active presales" ON public.presale_banners
        FOR SELECT USING (is_active = true);

    -- Admins can do everything
    DROP POLICY IF EXISTS "Admin Full Access Presales" ON public.presale_banners;
    CREATE POLICY "Admin Full Access Presales" ON public.presale_banners
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        );
END $$;

-- Updated at trigger
DROP TRIGGER IF EXISTS set_presale_banners_updated_at ON public.presale_banners;
CREATE TRIGGER set_presale_banners_updated_at
    BEFORE UPDATE ON public.presale_banners
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
