import { test, expect } from '@playwright/test';

test.describe('Guest Checkout Flow', () => {
    // Disable auth state for this test file to ensure guest mode
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
        // Ensure we are logged out
        await page.goto('/TCG/');
        // Clear local storage to reset guest cart
        await page.evaluate(() => localStorage.clear());
    });

    test('should allow guest to add items and checkout', async ({ page }) => {
        test.setTimeout(60000);
        try {
            // Monitor console logs
            page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
            console.log('TEST STARTED: Guest Checkout');

            await page.goto('/TCG/');
            page.on('request', request => {
                if (request.url().includes('get_unique_cards_optimized')) {
                    console.log('>>', request.method(), request.url());
                }
            });

            page.on('response', response => {
                if (response.url().includes('get_unique_cards_optimized')) {
                    console.log('<<', response.status(), response.url());
                }
                if (response.url().includes('get_products_filtered')) {
                    console.log('<< MARKETPLACE', response.status(), response.url());
                }
            });

            // Wait for loading to finish
            const spinner = page.getByText('Summoning Cards...');
            await expect(spinner).not.toBeVisible({ timeout: 30000 });

            // Check for error message (English or Spanish)
            const errorMsg = page.getByText(/Error Connection|Error de Conexión/i);
            if (await errorMsg.count() > 0) {
                console.log('Error Connection found on page');
                throw new Error('Frontend failed to load cards: Connection Error displayed');
            }

            // Wait for cards to be visible
            // Switch to Marketplace/Inventory tab to ensure we select in-stock items
            console.log('Switching to Marketplace tab...');
            await page.getByTestId('inventory-tab').click();

            // Verify tab is active
            await expect(page.getByTestId('inventory-tab')).toHaveClass(/bg-geeko-cyan/);

            // Wait for products filtered request NOT unique cards
            await page.waitForResponse(response => response.url().includes('get_products_filtered') && response.status() === 200, { timeout: 10000 }).catch(() => console.log('Wait for get_products_filtered timed out or already happened'));

            // Wait for cards to load
            const firstCard = page.getByTestId('product-card').first();
            console.log('Waiting for card image visibility...');
            await expect(firstCard).toBeVisible({ timeout: 30000 });

            // Verify it's not empty
            const cardsCount = await page.getByTestId('product-card').count();
            console.log(`Found ${cardsCount} cards in marketplace.`);
            if (cardsCount === 0) {
                throw new Error("No products found in marketplace!");
            }

            const cardImage = firstCard.getByTestId('product-image');
            console.log('Waiting for card image visibility...');
            await expect(cardImage).toBeVisible({ timeout: 10000 });
            console.log('Clicking card...');
            await cardImage.click();

            const modal = page.getByTestId('card-modal');
            console.log('Waiting for card modal...');
            await expect(modal).toBeVisible();

            const addToCartBtn = page.getByTestId('add-to-cart-button');
            console.log('Waiting for add to cart button...');
            await expect(addToCartBtn).toBeVisible();
            console.log('Clicking add to cart...');
            await addToCartBtn.click();

            // Wait for modal to close (implies add to cart finished)
            await expect(modal).toBeHidden({ timeout: 5000 });

            // Verify cart contents
            const cartContent = await page.evaluate(() => localStorage.getItem('guest_cart'));
            console.log('Guest Cart Content:', cartContent);

            // 2. Open cart drawer and verify item
            console.log('Checking if cart drawer is open...');
            const cartTitle = page.getByText('Tu Carrito');
            if (!(await cartTitle.isVisible())) {
                console.log('Cart drawer closed, opening manually...');
                const cartButton = page.locator('button[aria-label="Open cart"]');
                if (await cartButton.count() === 0) {
                    await page.locator('.lucide-shopping-cart').first().click();
                } else {
                    await cartButton.click();
                }
            } else {
                console.log('Cart drawer already open.');
            }

            // Wait for cart item to appear
            console.log('Waiting for cart item...');
            await expect(page.getByTestId('cart-item').first()).toBeVisible({ timeout: 10000 });

            console.log('Waiting for checkout button...');
            const checkoutButton = page.getByTestId('checkout-button');
            await expect(checkoutButton).toBeVisible();
            console.log('Clicking checkout...');
            await checkoutButton.click();

            // 3. Checkout Page - Guest Form
            console.log('Verifying checkout URL...');
            await expect(page).toHaveURL(/.*checkout/);

            // Fill Shipping Info
            console.log('Filling shipping info...');
            await page.getByPlaceholder('Full Name').fill('Guest User');
            await page.getByPlaceholder('Address Line 1').fill('123 Guest St');
            await page.getByPlaceholder('City').fill('Guest City');
            await page.getByPlaceholder('State').fill('GS');
            await page.getByPlaceholder('ZIP Code').fill('12345');
            // Check for new guest fields
            await page.getByPlaceholder('Email (para confirmación)').fill('guest@example.com');
            await page.getByPlaceholder('Teléfono').fill('555-0123');

            // Save Address
            console.log('Saving address...');
            await page.getByTestId('save-address-button').click();

            // Continue to Payment
            console.log('Continuing to payment...');
            const continueBtn = page.getByTestId('continue-to-payment');
            await expect(continueBtn).toBeEnabled({ timeout: 5000 });
            await continueBtn.click();

            // 4. Place Order
            console.log('Placing order...');
            const placeOrderBtn = page.getByTestId('place-order-button');
            await expect(placeOrderBtn).toBeVisible();
            await placeOrderBtn.click();

            // 5. Success Page
            console.log('Waiting for success page...');
            await expect(page).toHaveURL(/.*checkout\/success/, { timeout: 15000 });
            await expect(page.getByText('¡Orden Confirmada!')).toBeVisible();
            await expect(page.getByText('Gracias por tu compra')).toBeVisible();
            console.log('Test Complete');
        } catch (error) {
            console.error('TEST FAILED:', error);
            throw error;
        }
    });
});
