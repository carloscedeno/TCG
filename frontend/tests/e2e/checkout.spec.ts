import { test, expect } from '@playwright/test';

test.describe('Checkout Flow with Foil Cards', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should search for Boomerang, add foil to cart and verify cart contents', async ({ page }) => {
        // 1. Search for Boomerang
        const searchInput = page.getByPlaceholder(/Buscar|Search/i).first();
        await searchInput.click();

        // Wait for RPC response (wait for network request to complete)
        // Slowly type 'Boomerang' to simulate a real user and trigger the debounce
        await searchInput.pressSequentially('Boomerang', { delay: 100 });

        // Wait for the debounce and network request to complete
        await page.waitForTimeout(2000);

        // Wait for results
        const suggestions = page.getByTestId('suggestions-list').first();
        await expect(suggestions).toBeVisible();

        // 2. Click the Boomerang card from suggestions
        const boomerangSuggestion = suggestions.locator('button').filter({ hasText: /Boomerang/i }).first();
        await boomerangSuggestion.click();

        // Wait for modal to load
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // 3. Select Foil (if it's not already foil, click the Foil button)
        const foilButton = modal.getByRole('button', { name: 'FOIL', exact: true });
        if (await foilButton.isVisible()) {
            await foilButton.click();
        }

        // Additional check: Ensure it doesn't say NORMAL / NORMAL anymore due to previous bugs
        await expect(modal.getByText('NORMAL / NORMAL')).not.toBeVisible();

        // Extract price for verification
        // Since we don't know the exact price, we just ensure it's a valid price format
        const priceElement = modal.locator('.text-3xl.font-bold, .text-4xl.font-bold').first();
        const priceText = await priceElement.textContent();
        expect(priceText).toMatch(/\$\d+\.\d{2}/);

        // 4. Add to cart
        const addToCartBtn = modal.getByRole('button', { name: /Agregar al carrito/i });
        await addToCartBtn.click();

        // 5. Open Cart Drawer (it might open automatically, or we need to click the cart icon)
        // Wait for 'Agregado' state internally or just open cart
        const cartButton = page.locator('button').filter({ has: page.locator('svg.lucide-shopping-cart') }).first();
        await cartButton.click();

        // Wait for Cart Drawer
        const cartDrawer = page.locator('.fixed.inset-y-0.right-0');
        await expect(cartDrawer).toBeVisible();

        // 6. Verify item in cart
        // It shouldn't be "Auto-Created Product"
        await expect(cartDrawer.getByText('Auto-Created Product')).not.toBeVisible();

        // It should contain 'Boomerang'
        const cartItem = cartDrawer.locator('.flex.gap-4').filter({ hasText: /Boomerang/i }).first();
        await expect(cartItem).toBeVisible();

        // It should specify it is Foil (if we appended ' (Foil)')
        await expect(cartItem).toContainText(/\(Foil\)/i);

        // Price should not be $0.00
        const itemPrice = cartItem.locator('.font-bold.text-mint-400');
        await expect(itemPrice).not.toHaveText('$0.00');
        await expect(itemPrice).toHaveText(priceText || '');
    });
});
