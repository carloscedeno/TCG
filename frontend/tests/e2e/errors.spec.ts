import { test, expect } from '@playwright/test';

test.describe('Error Handling & Edge Cases', () => {
    test('should handle 404 page', async ({ page }) => {
        await page.goto('/invalid-page-xyz');
        await expect(page.locator('h1, h2')).toContainText(/404/);
        await expect(page.getByRole('link', { name: /Inicio|Home/i })).toBeVisible();
    });

    test('should validate checkout fields', async ({ page }) => {
        await page.goto('/checkout');
        // Attempt to continue with empty form
        await page.getByRole('button', { name: /Continuar|Continue/i }).click();

        // Check for validation messages
        // Assuming browser validation or custom messages
        const errorMessages = page.locator('.error-message, [aria-invalid="true"]');
        // If we can't find specific error classes, we check for presence of some warning
        await expect(page.locator('body')).toContainText(/requerido|required|falta/i);
    });

    test('should handle failed API responses gracefully', async ({ page }) => {
        // Mock a failed inventory fetch
        await page.route('**/rpc/get_inventory_list*', route => route.abort());

        await page.goto('/');
        // Check for error boundary or toast
        await expect(page.locator('body')).toContainText(/Error|problema|try again/i);
    });
});
