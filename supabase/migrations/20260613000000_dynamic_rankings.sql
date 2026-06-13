-- Migration for Dynamic Rankings (Seasons and Players)

-- 1. Create ranking_seasons table
CREATE TABLE IF NOT EXISTS public.ranking_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_context TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create player_rankings table
CREATE TABLE IF NOT EXISTS public.player_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.ranking_seasons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    player_photo_url TEXT,
    game_asset_url TEXT,
    tier_icon TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.ranking_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rankings ENABLE ROW LEVEL SECURITY;

-- 4. Public Policies (Read-Only)
CREATE POLICY "Public can read ranking seasons"
    ON public.ranking_seasons FOR SELECT
    USING (true);

CREATE POLICY "Public can read player rankings"
    ON public.player_rankings FOR SELECT
    USING (true);

-- 5. Admin Policies (All Access)
CREATE POLICY "Admins can manage ranking seasons"
    ON public.ranking_seasons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage player rankings"
    ON public.player_rankings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
