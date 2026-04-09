
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRPC() {
    console.log('Testing get_user_cart RPC...');
    
    // Test with a known user if possible, or just call it (will return defaults if no uid)
    const { data: cartData, error } = await supabase.rpc('get_user_cart');

    if (error) {
        console.error('RPC Error:', error);
        return;
    }

    console.log('Type of cartData:', typeof cartData);
    console.log('Value of cartData:', JSON.stringify(cartData, null, 2));
    
    if (cartData) {
        console.log('Keys in cartData:', Object.keys(cartData));
    }
}

testRPC();
