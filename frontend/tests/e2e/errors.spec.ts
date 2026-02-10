import { test, expect } from '@playwright/test';

test.describe('Error Handling & Edge Cases', () => {
    test('should handle 404 page', async ({ page }) => {
        await page.goto('invalid-page-xyz');
        await expect(page.locator('h1')).toContainText(/404/);
        await expect(page.getByRole('link', { name: /Inicio|Home/i })).toBeVisible();
    });

    test('should validate checkout fields', async ({ page }) => {
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
        await expect(addToCartBtn).toBeVisible();
        await addToCartBtn.click();

        // Wait for cart drawer to open and verify item added
        // "Tu Carrito" heading should be visible
        await expect(page.getByRole('heading', { name: /Tu Carrito/i })).toBeVisible();
        // Ensure cart is NOT empty
        await expect(page.locator('text=Tu carrito está vacío')).not.toBeVisible();

        await page.goto('checkout');
        // Attempt to continue with empty form
        await page.getByRole('button', { name: /Continuar|Continue/i }).click();

        // Check for validation messages
        // Assuming browser validation or custom messages
        const errorMessages = page.locator('.error-message, [aria-invalid="true"]');
        // If we can't find specific error classes, we check for presence of some warning
        await expect(page.locator('body')).toContainText(/requerido|required|falta/i);
    });

    test('should handle failed API responses gracefully', async ({ page }) => {
        // Mock a failed inventory fetch (main RPC used on home)
        await page.route('**/rpc/get_unique_cards_optimized*', route => route.abort());

        await page.goto('/');
        // Check for error boundary or toast
        await expect(page.locator('body')).toContainText(/Error|problema|try again|Conexión/i);
    });
});
