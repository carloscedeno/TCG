const fetch = require('node-fetch');

const API_URL = 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards';

async function testPerformance() {
    console.log('--- Performance Test: Card Details Endpoint ---');

    // 1. Get a sample card ID
    const listRes = await fetch(`${API_URL}?limit=1`);
    const listData = await listRes.json();
    if (!listData.cards || listData.cards.length === 0) {
        console.error('No cards found to test.');
        return;
    }

    const cardId = listData.cards[0].card_id;
    console.log(`Testing with Card ID: ${cardId}`);

    // 2. Measure response time
    const start = Date.now();
    const res = await fetch(`${API_URL}/${cardId}`);
    const end = Date.now();

    const data = await res.json();
    const duration = end - start;

    console.log(`Response received in ${duration}ms`);
    console.log(`All Versions Count: ${data.all_versions?.length || 0}`);

    if (duration < 300) {
        console.log('✅ Performance is GOOD (< 300ms)');
    } else if (duration < 600) {
        console.log('⚠️ Performance is OK (300ms - 600ms)');
    } else {
        console.log('❌ Performance is SLOW (> 600ms)');
    }
}

testPerformance().catch(console.error);
