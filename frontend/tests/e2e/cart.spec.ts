import { test, expect } from '@playwright/test';

test('shopping cart flow', async ({ page }) => {
    await page.goto('/');

    // 1. Find a card and open the modal
    // We'll look for any "Buy" or "Add" button if available, or just click a card image
    const card = page.locator('img').first();
    await card.click();

    // 2. Add to cart form the modal
    const addToCartButton = page.getByRole('button', { name: /Agregar|Add/i });
    if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
    }

    // 3. Verify cart drawer opens and shows the item
    await expect(page.locator('text=Tu Carrito|Your Cart')).toBeVisible();

    // 4. Click checkout
    const checkoutButton = page.getByRole('button', { name: /Finalizar|Checkout/i });
    await checkoutButton.click();

    // 5. Verify we are on the checkout page
    await expect(page).toHaveURL(/.*checkout/);
    await expect(page.locator('h1, h2')).toContainText(/Checkout/i);
});
