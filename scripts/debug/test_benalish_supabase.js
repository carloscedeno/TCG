import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxuotvogwvmxuvwbsscv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: cards, error: cardErr } = await supabase
        .from('cards')
        .select('*')
        .eq('name', 'Benalish Cavalry');

    if (cards && cards.length > 0) {
        console.log('Card:', cards[0].name, 'Finishes:', cards[0].finishes);
        const { data: printings, error: printErr } = await supabase
            .from('card_printings')
            .select('*, sets(*)')
            .eq('card_id', cards[0].card_id)
            .eq('collector_number', '4');

        if (printings && printings.length > 0) {
            printings.forEach(p => {
                console.log(`Printing: ${p.sets.set_code} #${p.collector_number} | is_foil: ${p.is_foil} | finishes: ${JSON.stringify(p.finishes)} | prices: ${JSON.stringify(p.prices)} | stock: ${p.stock}`);
            });
        }
    }
}
test().catch(console.error);
