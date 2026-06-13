-- Migration to update player_rankings columns for automated ranking system

ALTER TABLE public.player_rankings 
  DROP COLUMN IF EXISTS points,
  DROP COLUMN IF EXISTS tier_icon,
  DROP COLUMN IF EXISTS game_asset_url;

ALTER TABLE public.player_rankings 
  ADD COLUMN IF NOT EXISTS faction TEXT,
  ADD COLUMN IF NOT EXISTS conquest_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS takedown_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmed_kills INTEGER DEFAULT 0;
