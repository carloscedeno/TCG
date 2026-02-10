import { test, expect } from '@playwright/test';

test.describe('Shopping Cart & Checkout', () => {
    test.setTimeout(60000); // Increase timeout for the whole suite

    test.beforeEach(async ({ page }) => {
        // Use absolute URL to avoid any base path stripping issues
        await page.goto('/TCG/');
        await page.waitForLoadState('networkidle');
    });

    test('should persist cart items after refresh', async ({ page }) => {
        // Ensure we are in the Inventory tab to have buyable items
        await page.getByTestId('inventory-tab').click();

        // Wait for inventory content to load
        await expect(page.getByText('Sol Ring')).toBeVisible({ timeout: 20000 });

        // Find Sol Ring card and add to cart
        const productCard = page.locator('[data-testid="product-card"]').filter({ hasText: 'Sol Ring' });
        await productCard.click();

        // Wait for modal and add to cart
        await page.getByTestId('add-to-cart-button').click();

        // Wait for cart drawer to open and show item
        const cartItem = page.getByTestId('cart-item');
        await expect(cartItem).toBeVisible({ timeout: 10000 });
        await expect(cartItem).toContainText('Sol Ring');

        // Use explicit goto instead of reload to avoid base path stripping in some environments
        await page.goto('http://localhost:5174/TCG/');
        await page.waitForLoadState('networkidle');

        // Re-open cart
        await page.getByTestId('cart-button').click();
        await expect(page.getByTestId('cart-item')).toContainText('Sol Ring', { timeout: 15000 });
    });

    test('should update totals when quantity changes', async ({ page }) => {
        // TBD: Logic for quantity updates if/when UI elements are added
        test.skip();
    });

    test('should complete a full atomic checkout flow', async ({ page }) => {
        // 1. Add item from inventory
        await page.getByTestId('inventory-tab').click();
        await expect(page.getByText('Sol Ring')).toBeVisible({ timeout: 20000 });

        const productCard = page.locator('[data-testid="product-card"]').filter({ hasText: 'Sol Ring' });
        await productCard.click();
        await page.getByTestId('add-to-cart-button').click();

        // 2. Go to checkout
        await expect(page.getByTestId('cart-item')).toBeVisible({ timeout: 10000 });
        await page.getByText('Finalizar Compra').click();

        // 3. Complete checkout steps
        // Shipping Step - Fill if needed
        await expect(page.getByText('Detalles de Envío')).toBeVisible({ timeout: 15000 });

        const fullNameInput = page.getByTestId('full-name-input');
        if (await fullNameInput.isVisible()) {
            await fullNameInput.fill('Test User');
            await page.getByTestId('address-line1-input').fill('123 Test St');
            await page.getByTestId('city-input').fill('Test City');
            await page.getByTestId('state-input').fill('TS');
            await page.getByTestId('zip-code-input').fill('12345');
            await page.getByTestId('save-address-button').click();

            // Wait for address to be saved/selected (form disappears or moves to next step)
            await expect(page.getByTestId('save-address-button')).not.toBeVisible({ timeout: 10000 });
        }

        // Ensure "Continuar al Pago" is now enabled and click it
        const continueBtn = page.getByTestId('continue-to-payment');
        await expect(continueBtn).toBeEnabled({ timeout: 10000 });
        await continueBtn.click();

        // Payment Step
        await expect(page.getByText('Método de Pago')).toBeVisible({ timeout: 15000 });
        await page.getByTestId('place-order-button').click();

        // 4. Verification - Correction: UI says "Orden Confirmada"
        await expect(page.getByText('¡Orden Confirmada!')).toBeVisible({ timeout: 20000 });
    });
});
