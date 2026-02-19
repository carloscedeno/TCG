import { test, expect } from '@playwright/test';

test.describe('External Marketplace Links', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Dismiss the WelcomeModal (appears after 1.5s if sessionStorage key not set)
        await page.evaluate(() => sessionStorage.setItem('hasSeenWelcomeModal', 'true'));
        const welcomeButton = page.getByRole('button', { name: /Comenzar Misión/i });
        try {
            await welcomeButton.waitFor({ state: 'visible', timeout: 5000 });
            await welcomeButton.click();
            await welcomeButton.waitFor({ state: 'hidden', timeout: 3000 });
        } catch {
            // Modal didn't appear, continue
        }

        // Wait for cards to render
        await page.locator('[data-testid="product-card"]').first().waitFor({ state: 'visible', timeout: 15000 });
    });

    test('CardKingdom link in CardModal has correct format', async ({ page }) => {
        const firstCard = page.locator('[data-testid="product-card"]').first();
        const cardName = (await firstCard.locator('h3').textContent())?.trim() ?? '';
        await firstCard.click();

        await expect(page.getByTestId('card-modal')).toBeVisible({ timeout: 10000 });

        const ckLink = page.locator('a[href*="cardkingdom.com/catalog/search"]');
        await expect(ckLink).toBeVisible({ timeout: 10000 });

        const href = await ckLink.getAttribute('href');
        // The URL uses + for spaces, so normalize for comparison
        const decodedHref = decodeURIComponent(href?.replace(/\+/g, ' ') ?? '');
        expect(decodedHref).toContain(`filter[name]=${cardName}`);
    });

    test('CardKingdom foil link has mtg_foil tab when card is foil', async ({ page }) => {
        // Open the first card in the catalog
        await page.locator('[data-testid="product-card"]').first().click();
        await expect(page.getByTestId('card-modal')).toBeVisible({ timeout: 10000 });

        const ckLink = page.locator('a[href*="cardkingdom.com/catalog/search"]');
        await expect(ckLink).toBeVisible({ timeout: 10000 });

        // Check if the card is currently showing as FOIL
        const foilLabel = page.locator('span:has-text("FOIL")');
        const isFoil = await foilLabel.isVisible().catch(() => false);

        const href = await ckLink.getAttribute('href') ?? '';
        if (isFoil) {
            // If card displays FOIL, the CK link should have the foil tab
            expect(href).toContain('mtg_foil');
        } else {
            // If card is Normal, the CK link should NOT have the foil tab
            expect(href).not.toContain('mtg_foil');
        }
    });

    test('CardKingdom foil link updates when switching finishes', async ({ page }) => {
        // Open the first card (Hallowed Fountain has both Normal and Foil)
        await page.locator('[data-testid="product-card"]').first().click();
        await expect(page.getByTestId('card-modal')).toBeVisible({ timeout: 10000 });

        const ckLink = page.locator('a[href*="cardkingdom.com/catalog/search"]');
        await expect(ckLink).toBeVisible({ timeout: 10000 });

        // Check if Normal/Foil buttons exist
        const normalBtn = page.getByRole('button', { name: 'Normal', exact: true });
        const foilBtn = page.getByRole('button', { name: 'Foil', exact: true });

        const hasNormal = await normalBtn.isVisible({ timeout: 3000 }).catch(() => false);
        const hasFoil = await foilBtn.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasNormal && hasFoil) {
            // Click Foil and verify link updates
            await foilBtn.click();
            await expect(ckLink).toHaveAttribute('href', /mtg_foil/, { timeout: 5000 });

            // Click Normal and verify link updates back
            await normalBtn.click();
            await expect(ckLink).not.toHaveAttribute('href', /mtg_foil/, { timeout: 5000 });
        }
    });
});
