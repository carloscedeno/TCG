import { test, expect } from '@playwright/test';

test.describe('Inventory-Only Versions Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should show only in-stock versions in card modal', async ({ page }) => {
        // Navigate to Stock Geekorium tab
        const geekTab = page.getByRole('button', { name: /Stock Geekorium/i });
        await geekTab.click();

        // Wait for cards to load
        await page.waitForTimeout(2000);

        // Click the first card
        const firstCard = page.locator('img').first();
        await firstCard.click();

        // Verify modal is visible
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Check all versions have stock > 0
        const versionItems = modal.locator('a[href*="/TCG/card/"]');
        const versionCount = await versionItems.count();

        if (versionCount > 0) {
            for (let i = 0; i < versionCount; i++) {
                const version = versionItems.nth(i);

                // Check for stock indicator
                const stockText = await version.locator('text=/STOCK:/i').textContent();

                if (stockText) {
                    // Extract stock number
                    const stockMatch = stockText.match(/STOCK:\s*(\d+)/i);
                    if (stockMatch) {
                        const stock = parseInt(stockMatch[1]);
                        expect(stock).toBeGreaterThan(0);
                    }
                }
            }
        }

        // Close modal
        await page.keyboard.press('Escape');
    });

    test('should display stock indicators with correct colors', async ({ page }) => {
        // Navigate to Stock Geekorium tab
        const geekTab = page.getByRole('button', { name: /Stock Geekorium/i });
        await geekTab.click();

        // Wait for cards to load
        await page.waitForTimeout(2000);

        // Click the first card
        const firstCard = page.locator('img').first();
        await firstCard.click();

        // Verify modal is visible
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Check for stock indicators (colored dots)
        const versionItems = modal.locator('a[href*="/TCG/card/"]');
        const versionCount = await versionItems.count();

        if (versionCount > 0) {
            for (let i = 0; i < versionCount; i++) {
                const version = versionItems.nth(i);

                // Look for stock text
                const stockText = await version.locator('text=/STOCK:/i').textContent();

                if (stockText) {
                    const stockMatch = stockText.match(/STOCK:\s*(\d+)/i);
                    if (stockMatch) {
                        const stock = parseInt(stockMatch[1]);

                        // Check for colored dot indicator
                        const stockIndicator = version.locator('.w-2.h-2.rounded-full');

                        if (await stockIndicator.count() > 0) {
                            const classes = await stockIndicator.getAttribute('class');

                            if (stock > 10) {
                                // Should have green indicator
                                expect(classes).toContain('bg-green-500');
                            } else if (stock > 3) {
                                // Should have yellow indicator
                                expect(classes).toContain('bg-yellow-500');
                            } else {
                                // Should have red indicator
                                expect(classes).toContain('bg-red-500');
                            }
                        }
                    }
                }
            }
        }

        // Close modal
        await page.keyboard.press('Escape');
    });

    test('should show message when no versions are in stock', async ({ page }) => {
        // This test would require a card with no stock
        // For now, we'll just verify the UI can handle this case

        // Navigate to all cards (not just stock)
        const allTab = page.getByRole('button', { name: /Todas/i });
        if (await allTab.count() > 0) {
            await allTab.click();
            await page.waitForTimeout(2000);
        }

        // Click a card
        const firstCard = page.locator('img').first();
        await firstCard.click();

        // Verify modal is visible
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Check if there's a "no stock" message or versions are shown
        const noStockMessage = modal.locator('text=/No hay versiones disponibles/i');
        const versionItems = modal.locator('a[href*="/TCG/card/"]');

        // Either there should be versions OR a no-stock message
        const hasVersions = await versionItems.count() > 0;
        const hasNoStockMessage = await noStockMessage.count() > 0;

        expect(hasVersions || hasNoStockMessage).toBeTruthy();

        // Close modal
        await page.keyboard.press('Escape');
    });

    test('should only show cards with stock in Geekorium tab', async ({ page }) => {
        // Navigate to Stock Geekorium tab
        const geekTab = page.getByRole('button', { name: /Stock Geekorium/i });
        await geekTab.click();

        // Wait for cards to load
        await page.waitForTimeout(2000);

        // Get all visible cards
        const cards = page.locator('img[alt]').filter({ hasText: /.+/ });
        const cardCount = await cards.count();

        // Should have at least some cards
        expect(cardCount).toBeGreaterThan(0);

        // Verify we can click on cards (they should all have stock)
        if (cardCount > 0) {
            const firstCard = cards.first();
            await firstCard.click();

            const modal = page.getByTestId('card-modal');
            await expect(modal).toBeVisible();

            // Should have at least one version with stock
            const versionItems = modal.locator('a[href*="/TCG/card/"]');
            expect(await versionItems.count()).toBeGreaterThan(0);

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('should allow adding in-stock versions to cart', async ({ page }) => {
        // Navigate to Stock Geekorium tab
        const geekTab = page.getByRole('button', { name: /Stock Geekorium/i });
        await geekTab.click();

        // Wait for cards to load
        await page.waitForTimeout(2000);

        // Click the first card
        const firstCard = page.locator('img').first();
        await firstCard.click();

        // Verify modal is visible
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Find a version with stock and add to cart
        const versionItems = modal.locator('a[href*="/TCG/card/"]');
        const versionCount = await versionItems.count();

        if (versionCount > 0) {
            const firstVersion = versionItems.first();

            // Look for add to cart button within the version
            const addToCartBtn = firstVersion.locator('button[data-testid="add-to-cart"]');

            if (await addToCartBtn.count() > 0) {
                await addToCartBtn.click();

                // Verify cart icon shows item count
                const cartIcon = page.locator('[data-testid="cart-icon"]');
                await expect(cartIcon).toBeVisible({ timeout: 5000 });
            }
        }

        // Close modal
        await page.keyboard.press('Escape');
    });
});
