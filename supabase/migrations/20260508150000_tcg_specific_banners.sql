-- Migration: TCG-Specific Banners
-- Date: 2026-05-08

-- 1. Add game_code column to hero_banners
ALTER TABLE public.hero_banners 
ADD COLUMN IF NOT EXISTS game_code TEXT REFERENCES public.games(game_code) ON DELETE SET NULL;

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_hero_banners_game_code ON public.hero_banners(game_code);

-- 3. Comment on the column
COMMENT ON COLUMN public.hero_banners.game_code IS 'Optional reference to a specific game. If NULL, it is a global/main banner.';

-- 4. Ensure existing banners are treated as global (already NULL by default)
-- No explicit update needed.
