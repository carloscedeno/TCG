
import { test, expect } from '@playwright/test';

test.describe('Quick Stock Management', () => {
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('should show quick stock section in user menu and allow search', async ({ page }) => {
        await page.goto('/TCG/');

        // Click on User Menu (the profile bubble)
        const userMenuButton = page.locator('button').filter({ has: page.locator('.rounded-full.bg-gradient-to-br') });
        await userMenuButton.click();

        // Debug: Log if the section is visible
        const isSectionVisible = await page.getByText(/Gestión Rápida de Stock/i).isVisible();
        console.log('Is Admin Quick Stock section visible?', isSectionVisible);

        if (!isSectionVisible) {
            console.log('Menu content:', await page.locator('.absolute.right-0.mt-2').innerHTML());
        }

        await expect(page.getByText(/Gestión Rápida de Stock/i)).toBeVisible();

        // Search for a card
        const searchInput = page.getByTestId('quick-stock-search');
        await searchInput.fill('Black Lotus');

        // Wait for results
        await expect(page.getByTestId('quick-stock-results')).toBeVisible();

        // Wait for any item to appear (debounced search takes 400ms + RPC time)
        await expect(page.locator('.quick-stock-item').first()).toBeVisible({ timeout: 15000 });
    });
});
