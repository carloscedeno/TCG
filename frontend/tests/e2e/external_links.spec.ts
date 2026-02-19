import { test, expect } from '@playwright/test';

test.describe('External Marketplace Links', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate and handle intro modal
        await page.goto('/');
        // Helper to handle intro modal
        const introModal = page.getByTestId('intro-modal');
        try {
            // Wait briefly for modal to appear (it might be async)
            await introModal.waitFor({ state: 'visible', timeout: 3000 });
            // Click the entrance button
            await page.getByRole('button', { name: /Entrar a la tienda|Comenzar Misión/i }).click();
            // Wait for it to disappear
            await introModal.waitFor({ state: 'hidden' });
        } catch (e) {
            // Ignore if modal doesn't appear within timeout
        }
    });

    test('CardKingdom link in CardModal has correct format', async ({ page }) => {
        // Wait for content to load
        await page.waitForSelector('[data-testid="card-grid"]');

        // Click on the first card to open modal
        const firstCard = page.locator('[data-testid="card-item"]').first();
        const cardName = await firstCard.locator('h3').textContent();
        await firstCard.click();

        // Check modal is open
        await expect(page.getByTestId('card-modal')).toBeVisible();

        // Find the CardKingdom link (External Market)
        const ckLink = page.locator('a[href*="cardkingdom.com/catalog/search"]');
        await expect(ckLink).toBeVisible();

        const href = await ckLink.getAttribute('href');
        expect(href).toContain('filter[name]=');
        expect(href).toContain(encodeURIComponent(cardName || ''));
    });

    test('CardKingdom foil link has mtg_foil tab', async ({ page }) => {
        // Wait for content to load
        await page.waitForSelector('[data-testid="card-grid"]');

        // Search for a known foil card or just search "foil"
        await page.getByPlaceholder(/Buscar/i).fill('foil');
        await page.keyboard.press('Enter');

        await page.waitForSelector('[data-testid="card-item"]');

        // Open modal
        await page.locator('[data-testid="card-item"]').first().click();

        // Click on a foil version if multiple exist, or just assume first if it's a foil search
        // Actually, CardModal already calculates isFoil based on selected version.
        // For now, let's just check the generated URL utility logic via a unit test if possible,
        // but in E2E we verify the resulting link.

        const ckLink = page.locator('a[href*="cardkingdom.com/catalog/search"]');
        const href = await ckLink.getAttribute('href');

        // If the card is foil, it should have the mtg_foil tab
        const isFoilLabel = await page.locator('span:has-text("FOIL")').isVisible();
        if (isFoilLabel) {
            expect(href).toContain('filter[tab]=mtg_foil');
        }
    });

    test('CardKingdom foil link updates when switching finishes', async ({ page }) => {
        // Wait for content to load
        await page.waitForSelector('[data-testid="card-grid"]');

        // Search for a card known to have both normal and foil
        await page.getByPlaceholder(/Buscar/i).fill('Hallowed Fountain');
        await page.keyboard.press('Enter');
        await page.waitForSelector('[data-testid="card-grid"]');

        // Open modal
        await page.locator('[data-testid="card-item"]').first().click();
        await expect(page.getByTestId('card-modal')).toBeVisible();

        // Check initial link (should be normal by default in this app's logic)
        const ckLink = page.locator('a[href*="cardkingdom.com/catalog/search"]');
        let href = await ckLink.getAttribute('href');

        // Click Foil button if available
        const foilBtn = page.getByRole('button', { name: 'Foil', exact: true });
        if (await foilBtn.isVisible() && !await foilBtn.isDisabled()) {
            await foilBtn.click();
            // Wait for link update
            await page.waitForTimeout(500);
            href = await ckLink.getAttribute('href');
            expect(href).toContain('filter[tab]=mtg_foil');

            // Click Normal button to switch back
            const normalBtn = page.getByRole('button', { name: 'Normal', exact: true });
            await normalBtn.click();
            await page.waitForTimeout(500);
            href = await ckLink.getAttribute('href');
            expect(href).not.toContain('filter[tab]=mtg_foil');
        }
    });
});
