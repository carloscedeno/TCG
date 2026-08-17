const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bqfkqnnostzaqueujdms.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MDA2NDUsImV4cCI6MjA5MTM3NjY0NX0.xwqN-nP-_93cd3R1Q9fSkQMkf10d7whvVU6Uhk5uG-s';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: printings } = await supabase.from('card_printings').select('printing_id').limit(1);
    if (!printings || printings.length === 0) {
        console.log("No printings found!");
        return;
    }
    const pid = printings[0].printing_id;
    console.log("Testing with printing_id:", pid);

    const { data, error } = await supabase.rpc('get_products_stock_by_printing_ids', {
        p_printing_ids: [pid]
    });
    console.log("get_products_stock_by_printing_ids:", error || "SUCCESS");

    // Let's also fetch a real user id to test get_user_cart
    // I don't have permission to query auth.users with anon key, but maybe there is a user in a public table, e.g. carts
    const { data: carts } = await supabase.from('carts').select('user_id').limit(1);
    if (carts && carts.length > 0) {
        const uid = carts[0].user_id;
        console.log("Testing with user_id:", uid);
        const { data: cartData, error: cartErr } = await supabase.rpc('get_user_cart', {
            p_user_id: uid
        });
        console.log("get_user_cart error:", cartErr || "SUCCESS");
        console.log("get_user_cart data length:", cartData ? cartData.length : "null");

        // Test add_to_cart_v2 (note: might fail due to RLS if auth.uid() is required and not present)
        console.log("Testing add_to_cart_v2 with user_id:", uid);
        const { data: addData, error: addErr } = await supabase.rpc('add_to_cart_v2', {
            p_identifier: pid,
            p_quantity: 1,
            p_finish: 'nonfoil',
            p_user_id: uid
        });
        console.log("add_to_cart_v2 result:", addErr || addData);
    } else {
        console.log("No carts found to extract a user_id.");
    }
}
run();
