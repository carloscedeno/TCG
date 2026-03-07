import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
        process.exit(1);
    }

    const API_BASE = `${supabaseUrl}/functions/v1/tcg-api`;
    const cardId = '1013ca9c-1d29-42f6-8665-92f98d076ff8'; // Benalish Cavalry TSP #4

    console.log('Fetching directly from API...');
    let res = await fetch(`${API_BASE}/api/cards/${cardId}`, {
        headers: {
            'Authorization': `Bearer ${anonKey}`
        }
    });
    let data = await res.json();

    let versions = data.card ? data.card.all_versions : data.all_versions;
    if (versions) {
        console.log(`Found ${versions.length} versions`);
        versions.forEach(v => {
            console.log(`- ${v.set_code} #${v.collector_number} | Finish: ${v.finish} | is_foil: ${v.is_foil} | id: ${v.printing_id} | price: ${v.price}`);
        });
    } else {
        console.log('No all_versions found in Edge Function response.');
        console.log(data);
    }
}
test().catch(console.error);
