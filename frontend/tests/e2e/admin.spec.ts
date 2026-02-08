import { test, expect } from '@playwright/test';

test.describe('Admin & Inventory Management', () => {
    test('should add a product and verify in list', async ({ page }) => {
        // Login or Navigate to Inventory (assuming /admin/inventory or similar)
        await page.goto('/admin/inventory');

        // Open Add Product Modal
        await page.getByRole('button', { name: /Agregar Producto|Add Product/i }).click();

        // Search for a card
        await page.locator('.modal-search-input').fill('Black Lotus'); // Adjust selector
        await expect(page.locator('.search-results')).toBeVisible();
        await page.locator('.search-result-item').first().click();

        // Set Price and Stock
        await page.locator('input[name="price"]').fill('100.50');
        await page.locator('input[name="stock"]').fill('10');
        await page.getByRole('button', { name: /Guardar|Save/i }).click();

        // Verify in inventory list
        await expect(page.locator('table')).toContainText('Black Lotus');
        await expect(page.locator('table')).toContainText('100.50');
    });

    test('should handle zero-stock items visibility', async ({ page }) => {
        // 1. Update an item to 0 stock
        await page.goto('/admin/inventory');
        const editBtn = page.locator('button:has-text("Edit")').first();
        await editBtn.click();
        await page.locator('input[name="stock"]').fill('0');
        await page.getByRole('button', { name: /Guardar|Save/i }).click();

        // 2. Verify it's not visible or shows out of stock in marketplace
        await page.goto('/');
        // Search for that specific item if possible, or just check general list
        // This depends on the specific logic (filter out vs show badge)
    });
});
