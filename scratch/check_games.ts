
import { createClient } from '@supabase/supabase-client';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkGames() {
    const { data, error } = await supabase.from('games').select('*').limit(1);
    if (error) {
        console.error("Error fetching games:", error);
    } else {
        console.log("Games sample:", data);
    }
}

checkGames();
