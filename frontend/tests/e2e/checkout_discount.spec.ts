import { test, expect } from '@playwright/test';

const PRODUCT_ID = 'b611603a-92e9-4f7f-af30-a6319ab82b01';

test.describe('Checkout Discount Consistency', () => {
    test('should apply active discount at checkout', async ({ page }) => {
        await page.goto('/admin/inventory');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText(/Inventario/i, { timeout: 15000 });

        const result = await page.evaluate(async (productId) => {
            const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY';

            const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
            if (!sbKey) return { error: 'No supabase session' };
            const accessToken = JSON.parse(localStorage.getItem(sbKey) || '{}').access_token;
            if (!accessToken) return { error: 'No access token' };

            const base = 'https://sxuotvogwvmxuvwbsscv.supabase.co';
            const headers = {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            try {
                // 1. Get current user id via RPC
                const uidRes = await fetch(`${base}/rest/v1/rpc/current_user_id`, { method: 'POST', headers });
                const userId = await uidRes.json();
                if (!userId) return { error: 'Could not get user id' };

                // 2. Add to cart
                const addRes = await fetch(`${base}/rest/v1/rpc/add_to_cart`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ p_product_id: productId, p_quantity: 1, p_user_id: userId })
                });
                if (!addRes.ok) return { error: `add_to_cart: ${await addRes.text()}` };

                // 3. Get cart
                const cartRes = await fetch(`${base}/rest/v1/rpc/get_user_cart`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ p_user_id: userId })
                });
                const cartRaw = await cartRes.json();
                const cartItem = Array.isArray(cartRaw) ? cartRaw[0] : cartRaw;
                const item = cartItem?.items?.find((i: any) => i.product_id === productId);
                if (!item) return { error: 'Item not in cart' };

                const discountedPrice = Number(item.price);
                const originalPrice = Number(item.original_price || item.price);

                // 4. Checkout
                const orderRes = await fetch(`${base}/rest/v1/rpc/create_order_atomic`, {
                    method: 'POST', headers,
                    body: JSON.stringify({
                        p_user_id: userId,
                        p_items: [{
                            product_id: productId,
                            quantity: 1,
                            price: discountedPrice,
                            name: item.name,
                            printing_id: item.product_id,
                            finish: item.finish || 'nonfoil',
                            set: item.set_code
                        }],
                        p_shipping_address: { line1: 'Test', city: 'Caracas', country: 'VE' },
                        p_total_amount: discountedPrice,
                        p_cart_id: cartItem?.id
                    })
                });
                const orderResult = await orderRes.json();
                if (!orderResult.success) return { error: `create_order_atomic: ${JSON.stringify(orderResult)}` };

                // 5. Verify order_items
                const itemsRes = await fetch(
                    `${base}/rest/v1/order_items?order_id=eq.${orderResult.order_id}&select=*`,
                    { headers }
                );
                const orderItems = await itemsRes.json();

                return {
                    success: true,
                    orderId: orderResult.order_id,
                    originalPrice,
                    discountedPrice,
                    priceAtPurchase: orderItems?.[0]?.price_at_purchase
                };
            } catch (err: any) {
                return { error: err.message || String(err) };
            }
        }, PRODUCT_ID);

        console.log('Result:', JSON.stringify(result));
        expect(result.error).toBeUndefined();
        expect(result.success).toBe(true);
        expect(Number(result.originalPrice)).toBe(0.35);
        expect(Number(result.discountedPrice)).toBeCloseTo(0.28, 2);
        expect(Number(result.priceAtPurchase)).toBeCloseTo(0.28, 2);
    });
});
