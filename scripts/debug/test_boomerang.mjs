const supabaseUrl = 'https://sxuotvogwvmxuvwbsscv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTIyMzYsImV4cCI6MjA1NDgyODIzNn0.7aQetO44h0Z4oE2U8uF21m2I9mYss0D3jZ80Zrt5880';

async function main() {
    const res = await fetch(`${supabaseUrl}/rest/v1/cards?card_name=ilike.*Boomerang*&select=*,card_printings(*,sets(set_name,set_code),aggregated_prices(avg_market_price_usd))&limit=1`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    const data = await res.json();
    console.dir(data?.[0]?.card_printings?.slice(0, 5), { depth: null });
}
main();
