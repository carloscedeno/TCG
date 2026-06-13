import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
    console.log("🚀 Iniciando Simulación de Progresión de Rango...");

    const sql = `
    DO $$
    DECLARE
        v_season_id UUID := 'ef41c283-a964-4557-bc93-2e44389a36bb';
        v_user_id UUID := '4b9fd459-8fd9-416b-9f82-d94cc21915ac';
        v_player_id UUID;
    BEGIN
        -- Eliminar simulación previa
        DELETE FROM public.player_rankings WHERE user_id = v_user_id AND season_id = v_season_id;
        
        -- 1. Insert Initial
        INSERT INTO public.player_rankings (season_id, name, user_id, confirmed_kills, faction) 
        VALUES (v_season_id, 'Cyber Wizard', v_user_id, 0, 'ZEON') RETURNING id INTO v_player_id;
        
        -- Fix timestamp
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '30 days' WHERE player_ranking_id = v_player_id AND new_kills = 0;
        
        -- 2. First Kills
        UPDATE public.player_rankings SET confirmed_kills = 5, conquest_points = 10 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '25 days', reason = 'Batalla en A Baoa Qu' WHERE player_ranking_id = v_player_id AND new_kills = 5;

        -- 3. Insignia
        UPDATE public.player_rankings SET confirmed_kills = 9, takedown_points = 5 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '20 days', reason = 'Defensa de Side 3' WHERE player_ranking_id = v_player_id AND new_kills = 9;

        -- 4. Teniente
        UPDATE public.player_rankings SET confirmed_kills = 15, conquest_points = 25 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '15 days', reason = 'Operación British' WHERE player_ranking_id = v_player_id AND new_kills = 15;

        -- 5. Comandante
        UPDATE public.player_rankings SET confirmed_kills = 25, takedown_points = 12 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '10 days', reason = 'Ataque a Jaburo' WHERE player_ranking_id = v_player_id AND new_kills = 25;

        -- 6. Capitán
        UPDATE public.player_rankings SET confirmed_kills = 35, conquest_points = 40 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '7 days', reason = 'Campaña Terrestre' WHERE player_ranking_id = v_player_id AND new_kills = 35;

        -- 7. Contraalmirante
        UPDATE public.player_rankings SET confirmed_kills = 60, takedown_points = 30 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '3 days', reason = 'Batalla de Solomon' WHERE player_ranking_id = v_player_id AND new_kills = 60;

        -- 8. Almirante
        UPDATE public.player_rankings SET confirmed_kills = 85, conquest_points = 100, takedown_points = 50 WHERE id = v_player_id;
        UPDATE public.player_ranking_history SET created_at = NOW() - interval '1 hour', reason = 'Victoria Final en A Baoa Qu' WHERE player_ranking_id = v_player_id AND new_kills = 85;

    END $$;
    `;

    console.log("Nota: Para ejecutar esto necesitas permisos de Supabase rpc o usar SQL directo.");
    console.log("El SQL generado es:", sql);
    console.log("✅ Simulación creada y documentada.");
}

runSimulation();
