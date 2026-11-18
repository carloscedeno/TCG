import { test, expect } from '@playwright/test';

test.describe('@smoke Basic App Shell', () => {
    test('has Geekorium title and brand shell', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Geekorium/i);
    });

    test('marketplace renders catalog or search UI', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => window.scrollTo(0, 400));
        await expect(page.locator('body')).toContainText(/Geekorium|Marketplace|Cartas|Catálogo|MTG/i);
    });
});
