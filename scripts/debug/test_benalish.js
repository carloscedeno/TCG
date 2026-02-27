async function test() {
    let res = await fetch('https://dev-api.geekorium.shop/api/cards/search?q=Benalish%20Cavalry');
    let data = await res.json();
    let card = data.data.find(c => c.set_code === 'tsp' && c.collector_number === '4');

    if (!card) {
        console.log('Card not found in search');
        return;
    }

    console.log('Found card:', card.id);

    res = await fetch(`https://dev-api.geekorium.shop/api/cards/${card.id}`);
    data = await res.json();

    let versions = data.card ? data.card.all_versions : data.all_versions;
    if (versions) {
        versions.forEach(v => {
            console.log(`- ${v.set_code} #${v.collector_number} | Finish: ${v.finish} | is_foil: ${v.is_foil} | id: ${v.printing_id}`);
        });
    } else {
        console.log('No all_versions found in API response.');
    }
}

test().catch(console.error);
