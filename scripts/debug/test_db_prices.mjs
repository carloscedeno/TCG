import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxuotvogwvmxuvwbsscv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTIyMzYsImV4cCI6MjA1NDgyODIzNn0.7aQetO44h0Z4oE2U8uF21m2I9mYss0D3jZ80Zrt5880';
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
