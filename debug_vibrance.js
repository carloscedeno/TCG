
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    const cardName = 'Vibrance';
    console.log(`Searching for card: ${cardName}`);

    // 1. Get card printings
    const { data: printings, error: pError } = await supabase
        .from('card_printings')
        .select('printing_id, card_id, collector_number, avg_market_price_usd, avg_market_price_foil_usd, sets(set_name)')
        .eq('name', cardName);

    if (pError) console.error('Error fetching printings:', pError);
    console.log('--- Card Printings ---');
    printings?.forEach(p => {
        console.log(`ID: ${p.printing_id}, Set: ${p.sets.set_name}, Coll#: ${p.collector_number}, Mkt: ${p.avg_market_price_usd}, Mkt Foil: ${p.avg_market_price_foil_usd}`);
    });

    // 2. Get product stock
    const printingIds = printings?.map(p => p.printing_id) || [];
    const { data: products, error: prError } = await supabase
        .from('products')
        .select('*')
        .in('printing_id', printingIds);

    if (prError) console.error('Error fetching products:', prError);
    console.log('\n--- Products (Stock) ---');
    products?.forEach(p => {
        console.log(`ID: ${p.id}, PrintID: ${p.printing_id}, Finish: ${p.finish}, Stock: ${p.stock}, Price: ${p.price}`);
    });
}

debug();
