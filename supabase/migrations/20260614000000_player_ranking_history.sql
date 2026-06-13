-- Migration for Player Ranking History

CREATE TABLE IF NOT EXISTS public.player_ranking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_ranking_id UUID NOT NULL REFERENCES public.player_rankings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    season_id UUID NOT NULL REFERENCES public.ranking_seasons(id) ON DELETE CASCADE,
    previous_kills INTEGER DEFAULT 0,
    new_kills INTEGER DEFAULT 0,
    previous_conquest INTEGER DEFAULT 0,
    new_conquest INTEGER DEFAULT 0,
    previous_takedown INTEGER DEFAULT 0,
    new_takedown INTEGER DEFAULT 0,
    previous_rank_name TEXT,
    new_rank_name TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.player_ranking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read player ranking history"
    ON public.player_ranking_history FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage player ranking history"
    ON public.player_ranking_history FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Helper function to derive rank
CREATE OR REPLACE FUNCTION get_military_rank_name(kills INTEGER, faction TEXT) RETURNS TEXT AS $$
BEGIN
    IF kills >= 80 THEN RETURN 'Almirante';
    ELSIF kills >= 50 THEN RETURN 'Contraalmirante';
    ELSIF kills >= 30 THEN RETURN 'Capitán';
    ELSIF kills >= 20 THEN RETURN 'Comandante';
    ELSIF kills >= 12 THEN RETURN 'Teniente';
    ELSIF kills >= 8 THEN RETURN 'Insignia';
    ELSIF kills >= 4 THEN RETURN 'Suboficial en Jefe';
    ELSE
        IF faction = 'ZEON' THEN RETURN 'Cadete'; ELSE RETURN 'Tripulante'; END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger Function
CREATE OR REPLACE FUNCTION trg_player_ranking_audit() RETURNS TRIGGER AS $$
DECLARE
    old_rank TEXT;
    new_rank TEXT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.confirmed_kills IS DISTINCT FROM NEW.confirmed_kills 
           OR OLD.conquest_points IS DISTINCT FROM NEW.conquest_points 
           OR OLD.takedown_points IS DISTINCT FROM NEW.takedown_points THEN
            
            old_rank := get_military_rank_name(COALESCE(OLD.confirmed_kills, 0), OLD.faction);
            new_rank := get_military_rank_name(COALESCE(NEW.confirmed_kills, 0), NEW.faction);
            
            INSERT INTO public.player_ranking_history (
                player_ranking_id, user_id, season_id,
                previous_kills, new_kills,
                previous_conquest, new_conquest,
                previous_takedown, new_takedown,
                previous_rank_name, new_rank_name, reason
            ) VALUES (
                NEW.id, NEW.user_id, NEW.season_id,
                OLD.confirmed_kills, NEW.confirmed_kills,
                OLD.conquest_points, NEW.conquest_points,
                OLD.takedown_points, NEW.takedown_points,
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
            previous_rank_name, new_rank_name, reason
        ) VALUES (
            NEW.id, NEW.user_id, NEW.season_id,
            0, NEW.confirmed_kills,
            0, NEW.conquest_points,
            0, NEW.takedown_points,
            'Recluta', new_rank, 'Alistamiento Inicial'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS trg_player_rankings_update ON public.player_rankings;
CREATE TRIGGER trg_player_rankings_update
AFTER INSERT OR UPDATE ON public.player_rankings
FOR EACH ROW EXECUTE FUNCTION trg_player_ranking_audit();
