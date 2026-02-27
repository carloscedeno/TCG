// Test script to verify API response
const API_BASE = 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api';
const testId = 'ba165e25-5328-40f4-b87c-9d02590f9d38';

fetch(`${API_BASE}/api/cards/${testId}`, {
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY'
    }
})
    .then(r => r.json())
    .then(data => {
        console.log('=== API RESPONSE ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('\n=== FIELDS CHECK ===');
        console.log('Has name:', !!data.name);
        console.log('Has oracle_text:', !!data.oracle_text);
        console.log('Has price:', !!data.price);
        console.log('Has valuation:', !!data.valuation);
        console.log('Has valuation.market_url:', !!data.valuation?.market_url);
    })
    .catch(err => console.error('Error:', err));
