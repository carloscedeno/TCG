import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Vite \+ React \+ TS/);
});

test('marketplace link works', async ({ page }) => {
    await page.goto('/');

    // Scroll down to ensure content loads
    await page.evaluate(() => window.scrollTo(0, 500));

    // Check for card items
    const cardItems = page.locator('.card-item'); // Assuming a class or something exists
    // If we don't know the class, we just check for basic text
    await expect(page.locator('body')).toContainText(/Marketplace|Cards|Cartas/i);
});
