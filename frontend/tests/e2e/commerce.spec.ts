import { test, expect } from '@playwright/test';

test.describe('Shopping Cart & Checkout', () => {
    test.setTimeout(60000); // Increase timeout for the whole suite

    test.beforeEach(async ({ page }) => {
        // Use relative URL to avoid any base path stripping issues
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Clear cart before each test
        try {
            await page.getByTestId('cart-button').click();

            // Wait for cart to open
            await page.waitForTimeout(500);

            // Remove all items if any exist
            const removeButtons = page.getByTestId('remove-item-button');
            const count = await removeButtons.count();

            for (let i = 0; i < count; i++) {
                await removeButtons.first().click();
                await page.waitForTimeout(300); // Wait for removal animation
            }

            // Close cart
            await page.getByTestId('cart-button').click();
            await page.waitForTimeout(300);
        } catch (error) {
            console.log('Cart cleanup skipped (cart may already be empty):', error);
        }
    });

    test('should persist cart items after refresh', async ({ page }) => {
        // Ensure we are in the Inventory tab to have buyable items
        await page.getByTestId('inventory-tab').click();

        // Wait for inventory content to load
        // Wait for inventory content to load
        await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 20000 });

        // Find first card and add to cart
        const productCard = page.locator('[data-testid="product-card"]').first();
        const productName = await productCard.locator('h3').textContent();
        await productCard.click();

        // Wait for modal and add to cart
        await page.getByTestId('add-to-cart-button').click();

        // Wait for cart drawer to open and show item
        const cartItem = page.getByTestId('cart-item');
        await expect(cartItem).toBeVisible({ timeout: 10000 });
        if (productName) {
            await expect(cartItem).toContainText(productName);
        }

        // Use explicit goto instead of reload to avoid base path stripping in some environments
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Re-open cart
        await page.getByTestId('cart-button').click();
        if (productName) {
            await expect(page.getByTestId('cart-item')).toContainText(productName, { timeout: 15000 });
        }
    });

    test('should update totals when quantity changes', async ({ page }) => {
        // Add item from inventory
        await page.getByTestId('inventory-tab').click();
        await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 20000 });

        const productCard = page.locator('[data-testid="product-card"]').first();
        await productCard.click();
        await page.getByTestId('add-to-cart-button').click();

        // Wait for cart to show item
        await expect(page.getByTestId('cart-item')).toBeVisible({ timeout: 10000 });

        // Get initial quantity and total
        const quantityText = await page.locator('[data-testid="cart-item"] span:has-text("x")').textContent();
        expect(quantityText).toContain('x1');

        // Increase quantity
        await page.getByTestId('increase-quantity-button').click();
        await page.waitForTimeout(500); // Wait for update

        // Verify quantity increased
        const newQuantityText = await page.locator('[data-testid="cart-item"] span:has-text("x")').textContent();
        expect(newQuantityText).toContain('x2');

        // Decrease quantity
        await page.getByTestId('decrease-quantity-button').click();
        await page.waitForTimeout(500); // Wait for update

        // Verify quantity decreased back to 1
        const finalQuantityText = await page.locator('[data-testid="cart-item"] span:has-text("x")').textContent();
        expect(finalQuantityText).toContain('x1');
    });

    test('should remove items from cart', async ({ page }) => {
        // Add item from inventory
        await page.getByTestId('inventory-tab').click();
        await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 20000 });

        const productCard = page.locator('[data-testid="product-card"]').first();
        await productCard.click();
        await page.getByTestId('add-to-cart-button').click();

        // Wait for cart to show item
        await expect(page.getByTestId('cart-item')).toBeVisible({ timeout: 10000 });

        // Remove item
        await page.getByTestId('remove-item-button').click();
        await page.waitForTimeout(500); // Wait for removal

        // Verify cart is empty
        await expect(page.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 5000 });
    });

    test('should complete a full atomic checkout flow', async ({ page }) => {
        // 1. Add item from inventory
        await page.getByTestId('inventory-tab').click();
        await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 20000 });

        const productCard = page.locator('[data-testid="product-card"]').first();
        const productName = await productCard.locator('h3').textContent();
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
            // Fill required phone and email (using placeholder if no testid)
            await page.getByPlaceholder(/Email/i).fill('test@example.com');
            await page.getByPlaceholder(/Teléfono/i).fill('1234567890');

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
