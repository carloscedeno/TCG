-- Migration: Hierarchical Rankings (N-Levels) and Configurable Features

-- 1. Alter ranking_seasons
ALTER TABLE public.ranking_seasons 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create ranking_categories (Teams, Factions, Categories)
CREATE TABLE IF NOT EXISTS public.ranking_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.ranking_seasons(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.ranking_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create ranking_tiers
CREATE TABLE IF NOT EXISTS public.ranking_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.ranking_seasons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.ranking_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alter player_rankings
ALTER TABLE public.player_rankings 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.ranking_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.ranking_tiers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 5. Alter player_ranking_history to support generic points
ALTER TABLE public.player_ranking_history
ADD COLUMN IF NOT EXISTS previous_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_points INTEGER DEFAULT 0;

-- 6. Update Trigger to record generic points change
CREATE OR REPLACE FUNCTION trg_player_ranking_audit() RETURNS TRIGGER AS $$
DECLARE
    old_rank TEXT;
    new_rank TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.confirmed_kills IS DISTINCT FROM NEW.confirmed_kills 
           OR OLD.conquest_points IS DISTINCT FROM NEW.conquest_points 
           OR OLD.takedown_points IS DISTINCT FROM NEW.takedown_points
           OR OLD.points IS DISTINCT FROM NEW.points THEN
            
            old_rank := get_military_rank_name(COALESCE(OLD.confirmed_kills, 0), OLD.faction);
            new_rank := get_military_rank_name(COALESCE(NEW.confirmed_kills, 0), NEW.faction);
            
            INSERT INTO public.player_ranking_history (
                player_ranking_id, user_id, season_id,
                previous_kills, new_kills,
                previous_conquest, new_conquest,
                previous_takedown, new_takedown,
                previous_points, new_points,
                previous_rank_name, new_rank_name, reason
            ) VALUES (
                NEW.id, NEW.user_id, NEW.season_id,
                OLD.confirmed_kills, NEW.confirmed_kills,
                OLD.conquest_points, NEW.conquest_points,
                OLD.takedown_points, NEW.takedown_points,
                OLD.points, NEW.points,
                old_rank, new_rank, 'Actualización de Puntuación'
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        new_rank := get_military_rank_name(COALESCE(NEW.confirmed_kills, 0), NEW.faction);
        
        INSERT INTO public.player_ranking_history (
            player_ranking_id, user_id, season_id,
            previous_kills, new_kills,
            previous_conquest, new_conquest,
            previous_takedown, new_takedown,
            previous_points, new_points,
            previous_rank_name, new_rank_name, reason
        ) VALUES (
            NEW.id, NEW.user_id, NEW.season_id,
            0, NEW.confirmed_kills,
            0, NEW.conquest_points,
            0, NEW.takedown_points,
            0, NEW.points,
            'Recluta', new_rank, 'Alistamiento Inicial'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable RLS
ALTER TABLE public.ranking_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_tiers ENABLE ROW LEVEL SECURITY;

-- 8. Public Policies
CREATE POLICY "Public can read active categories"
    ON public.ranking_categories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ranking_seasons rs
            WHERE rs.id = season_id AND rs.is_active = true
        )
    );

CREATE POLICY "Public can read active tiers"
    ON public.ranking_tiers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.ranking_seasons rs
            WHERE rs.id = season_id AND rs.is_active = true
        )
    );

-- Replace ranking_seasons public policy
DROP POLICY IF EXISTS "Public can read ranking seasons" ON public.ranking_seasons;
CREATE POLICY "Public can read active ranking seasons"
    ON public.ranking_seasons FOR SELECT
    USING (is_active = true);

-- Add Admin Policies
CREATE POLICY "Admins can manage categories"
    ON public.ranking_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage tiers"
    ON public.ranking_tiers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
