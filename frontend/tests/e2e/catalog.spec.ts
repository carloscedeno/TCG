import { test, expect } from '@playwright/test';

test.describe('Catalog & Exploration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should navigate between game tabs', async ({ page }) => {
        // Verify default tab (e.g., MTG) or select it
        let activeTab = page.locator('button[data-active="true"]');
        if (await activeTab.count() === 0) {
            const mtgTab = page.getByRole('button', { name: /Magic: The Gathering/i });
            await mtgTab.click();
            activeTab = page.locator('button[data-active="true"]');
        }
        await expect(activeTab).toBeVisible();

        // Switch to Pokemon (assuming there's a button with "Pokemon")
        const pokemonTab = page.getByRole('button', { name: /Pokémon/i });
        await pokemonTab.click();

        // Verify URL updates
        await expect(page).toHaveURL(/.*game=POKEMON/i, { timeout: 10000 });

        // Switch to Lorcana
        const lorcanaTab = page.getByRole('button', { name: /Lorcana/i });
        await lorcanaTab.click();
        await expect(page).toHaveURL(/.*game=LORCANA/i);
    });

    test('should support infinite scroll', async ({ page }) => {
        // Wait for initial cards
        const initialCards = page.locator('.card-item'); // Assuming card-item class
        const initialCount = await initialCards.count();

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Wait for more cards to load
        await expect(async () => {
            const currentCount = await initialCards.count();
            expect(currentCount).toBeGreaterThan(initialCount);
        }).toPass({ timeout: 10000 });
    });

    test('should open card detail modal and show editions', async ({ page }) => {
        // Click the first card
        const firstCard = page.locator('img').first();
        await firstCard.click();

        // Verify modal is visible
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Verify card name is prominent
        const title = modal.locator('h2');
        await expect(title).toBeVisible({ timeout: 10000 });
        await expect(title).not.toBeEmpty();

        // Check for editions within the modal
        const editionsLinks = modal.locator('a[href*="/TCG/card/"]');
        await expect(editionsLinks.first()).toBeVisible({ timeout: 10000 });
        const count = await editionsLinks.count();
        expect(count).toBeGreaterThan(0);

        // Close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
    });
});
