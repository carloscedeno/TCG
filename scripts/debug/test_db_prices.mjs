import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('card_printings')
        .select('*, sets(set_name), aggregated_prices(*)')
        .eq('set_code', 'ecl')
        .eq('collector_number', '290');

    if (error) console.error(error);
    console.dir(data, { depth: null });
}
main();
