
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkGames() {
    try {
        const { data, error } = await supabase.from('games').select('*').limit(1);
        if (error) {
            console.error("Error fetching games:", error);
        } else {
            console.log("Games sample:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Critical error:", e);
    }
}

checkGames();
