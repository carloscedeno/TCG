async function test() {
    const API_BASE = 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY';
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
