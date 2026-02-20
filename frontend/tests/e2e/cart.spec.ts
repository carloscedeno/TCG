import { test, expect } from '@playwright/test';

test('shopping cart flow', async ({ page }) => {
    await page.goto('/');

    // Handle Intro Modal if it appears
    const introButton = page.getByRole('button', { name: /Comenzar Misión/i });
    if (await introButton.isVisible()) {
        await introButton.click();
    }

    // 1. Find a card and open the modal
    const card = page.getByTestId('product-card').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.click();

    // 2. Add to cart form the modal
    const addToCartButton = page.getByTestId('add-to-cart-button');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // 3. Verify cart drawer opens
    // Using test id or localized text
    const cartDrawer = page.getByTestId('cart-drawer');
    if (await cartDrawer.isVisible()) {
        await expect(cartDrawer).toBeVisible();
    } else {
        await expect(page.locator('text=carrito|tu pedido|carro|cart/i')).toBeVisible();
    }
});
