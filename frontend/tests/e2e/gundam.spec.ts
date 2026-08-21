import { test, expect } from '@playwright/test';

test.describe('Gundam UI Isolation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        await page.evaluate(() => sessionStorage.setItem('hasSeenWelcomeModal', 'true'));
        try {
            const welcomeButton = page.getByRole('button', { name: /Comenzar Misión/i });
            await welcomeButton.waitFor({ state: 'visible', timeout: 3000 });
            await welcomeButton.click();
        } catch (e) { 
            void e; // ignore timeout
        }
        await page.waitForTimeout(2000);
    });

    test('Navigates to GND and verifies filters and headers', async ({ page }) => {
        await page.goto('/?game=GND&tab=marketplace');
        await expect(page.locator('text=SINGLES - GUNDAM')).toBeVisible({ timeout: 10000 });

        await page.getByText('Colores').first().click();
        await page.getByText('Tipo', { exact: true }).first().click();

        await expect(page.locator('body')).toContainText('Yellow');
        await expect(page.locator('body')).toContainText('Purple');
        await expect(page.locator('body')).not.toContainText('Creature');
        await expect(page.locator('body')).toContainText('Unit');
        await expect(page.locator('body')).toContainText('Pilot');
    });
});
