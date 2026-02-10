import { test, expect } from '@playwright/test';

// Increase timeout for slow environments
test.setTimeout(60000);

test.describe('Error Handling & Edge Cases', () => {
    test('should handle 404 page', async ({ page }) => {
        await page.goto('invalid-page-xyz');
        await expect(page.locator('h1')).toContainText(/404/);
        await expect(page.getByRole('link', { name: /Inicio|Home/i })).toBeVisible();
    });

    test('should validate checkout fields', async ({ page }) => {
        // Mock empty address list to force new address form
        await page.route('**/rest/v1/user_addresses*', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        }));

        // Ensure we have items in cart to reach checkout
        await page.goto('/');

        // Add an item to cart similar to guest_checkout flow
        const responsePromise = page.waitForResponse(resp => resp.url().includes('get_products_filtered') && resp.status() === 200);
        await page.getByTestId('inventory-tab').click();
        await expect(page.getByTestId('inventory-tab')).toHaveClass(/bg-geeko-cyan/);
        await responsePromise;

        // Click first card and add to cart
        await expect(page.getByTestId('product-card').first()).toBeVisible();
        const firstCard = page.getByTestId('product-card').first();
        await firstCard.getByTestId('product-image').click();

        // Wait for add-to-cart button
        const addToCartBtn = page.getByTestId('add-to-cart-button');
        // Check for button state
        await expect(addToCartBtn).toBeEnabled();
        await addToCartBtn.click();

        // Wait for cart drawer to open and verify item added
        // "Tu Carrito" heading should be visible
        await expect(page.getByRole('heading', { name: /Tu Carrito/i })).toBeVisible();

        // Ensure cart has items
        await expect(page.locator('.cart-item, [data-testid="cart-item"]')).toHaveCount(1);

        // Ensure "empty" message is GONE (wait for it to disappear if present)
        await expect(page.getByText(/Tu carrito está vacío/i)).not.toBeVisible();

        await page.goto('checkout');
        // Attempt to save address with empty form
        await page.getByTestId('save-address-button').click();

        // Check for validation messages
        await expect(page.locator('.error-message')).toBeVisible();
        await expect(page.locator('.error-message')).toContainText(/Todos los campos son requeridos/i);
    });

    test('should handle failed API responses gracefully', async ({ page }) => {
        // Mock a failed inventory fetch (main RPC used on home)
        await page.route('**/rpc/get_unique_cards_optimized*', route => route.abort());

        await page.goto('/');
        // Check for error boundary or toast
        await expect(page.locator('body')).toContainText(/Error|problema|try again|Conexión/i);
    });
});
