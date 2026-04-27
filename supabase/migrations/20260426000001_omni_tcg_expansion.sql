-- Migration: Omni-TCG Structural Expansion (Zero Risk Version)
-- Description: Adds new games and implements a robust validation trigger for game-specific mechanics.
-- This version focuses ONLY on adding new functionality without modifying existing table constraints.

-- 1. Sync Sequence and Insert Games
SELECT setval(pg_get_serial_sequence('public.games', 'game_id'), (SELECT MAX(game_id) FROM public.games));

INSERT INTO public.games (game_name, game_code, description, is_active)
VALUES
    ('Pokémon TCG', 'PKM', 'Pokémon Trading Card Game', true),
    ('One Piece Card Game', 'OPC', 'One Piece TCG', true),
    ('Digimon TCG', 'DGM', 'Digimon Card Game', true),
    ('Flesh and Blood', 'FAB', 'Flesh and Blood TCG', true),
    ('Gundam TCG', 'GND', 'Gundam Arsenal Base', true),
    ('Riftbound', 'RFB', 'Riftbound TCG', true)
ON CONFLICT (game_code) DO UPDATE SET is_active = true;

-- 2. Validation Function for TCG-Specific Attributes
CREATE OR REPLACE FUNCTION public.fn_validate_tcg_attributes()
RETURNS TRIGGER AS $$
DECLARE
    v_game_code TEXT;
BEGIN
    -- Get the game code for the current game_id
    SELECT game_code INTO v_game_code FROM public.games WHERE game_id = NEW.game_id;

    -- Exit if no game is found or no attributes to check
    IF v_game_code IS NULL THEN
        RETURN NEW;
    END IF;

    -- Validation Rules per Game
    CASE v_game_code
        WHEN 'PKM' THEN -- Pokémon
            IF NOT (NEW.tcg_specific_attributes ? 'hp' AND 
                    NEW.tcg_specific_attributes ? 'stage' AND 
                    NEW.tcg_specific_attributes ? 'retreat_cost') THEN
                RAISE EXCEPTION 'Pokémon cards must have hp, stage, and retreat_cost in tcg_specific_attributes';
            END IF;

        WHEN 'OPC' THEN -- One Piece
            IF NOT (NEW.tcg_specific_attributes ? 'cost' AND 
                    NEW.tcg_specific_attributes ? 'power' AND 
                    NEW.tcg_specific_attributes ? 'color') THEN
                RAISE EXCEPTION 'One Piece cards must have cost, power, and color in tcg_specific_attributes';
            END IF;

        WHEN 'DGM' THEN -- Digimon
            IF NOT (NEW.tcg_specific_attributes ? 'play_cost' AND 
                    NEW.tcg_specific_attributes ? 'dp' AND 
                    NEW.tcg_specific_attributes ? 'level') THEN
                RAISE EXCEPTION 'Digimon cards must have play_cost, dp, and level in tcg_specific_attributes';
            END IF;

        WHEN 'FAB' THEN -- Flesh and Blood (including math balance)
            IF NOT (NEW.tcg_specific_attributes ? 'pitch' AND 
                    NEW.tcg_specific_attributes ? 'cost' AND 
                    NEW.tcg_specific_attributes ? 'defense') THEN
                RAISE EXCEPTION 'FAB cards must have pitch, cost, and defense in tcg_specific_attributes';
            END IF;
            
            -- Validation: Pitch + Attack + Defense - Cost = 8
            IF ((COALESCE((NEW.tcg_specific_attributes->>'pitch')::int, 0) + 
                 COALESCE((NEW.tcg_specific_attributes->>'attack')::int, 0) + 
                 COALESCE((NEW.tcg_specific_attributes->>'defense')::int, 0) - 
                 COALESCE((NEW.tcg_specific_attributes->>'cost')::int, 0)) != 8) THEN
                RAISE EXCEPTION 'FAB card balance check failed: Pitch + Attack + Defense - Cost must equal 8';
            END IF;

        WHEN 'GND' THEN -- Gundam
            IF NOT (NEW.tcg_specific_attributes ? 'cost_level' AND 
                    NEW.tcg_specific_attributes ? 'ap' AND 
                    NEW.tcg_specific_attributes ? 'hp') THEN
                RAISE EXCEPTION 'Gundam cards must have cost_level, ap, and hp in tcg_specific_attributes';
            END IF;

        WHEN 'RFB' THEN -- Riftbound
            IF NOT (NEW.tcg_specific_attributes ? 'might' AND 
                    NEW.tcg_specific_attributes ? 'cost' AND 
                    NEW.tcg_specific_attributes ? 'domains') THEN
                RAISE EXCEPTION 'Riftbound cards must have might, cost, and domains in tcg_specific_attributes';
            END IF;
        
        ELSE
            -- No specific rules for other games (like MTG)
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_validate_tcg_attributes ON public.cards;
CREATE TRIGGER trg_validate_tcg_attributes
BEFORE INSERT OR UPDATE ON public.cards
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_tcg_attributes();

-- 4. Performance: GIN Index for JSONB attributes (Conditional creation)
-- Only creating if it doesn't exist to avoid errors.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cards_tcg_attributes') THEN
        CREATE INDEX idx_cards_tcg_attributes ON public.cards USING GIN (tcg_specific_attributes);
    END IF;
END $$;
