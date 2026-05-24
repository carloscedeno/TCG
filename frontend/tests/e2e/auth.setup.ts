import { test as setup, expect } from '@playwright/test';

setup('authenticate as admin', async ({ page }) => {
    await page.goto('/admin/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Acceso Restringido')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Ingresar al Sistema/i }).click();

    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[type="email"]').fill('admin@geeko.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.getByRole('button', { name: /Identificarse/i }).click();

    await expect(page.locator('h1')).toContainText(/GEEKOSYSTEM/i, { timeout: 15000 });

    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
