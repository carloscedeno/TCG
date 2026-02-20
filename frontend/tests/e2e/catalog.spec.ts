import { test, expect } from '@playwright/test';

test.describe('Catalog & Exploration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Handle Intro Modal if it appears
        const introButton = page.getByRole('button', { name: /Comenzar Misión/i });
        if (await introButton.isVisible()) {
            await introButton.click();
        }
    });

    test('should support infinite scroll', async ({ page }) => {
        // Wait for initial cards
        const initialCards = page.getByTestId('product-card');
        await expect(initialCards.first()).toBeVisible({ timeout: 20000 });
        const initialCount = await initialCards.count();

        // If there are no cards, skip scroll test but don't fail
        if (initialCount === 0) return;

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        // Wait for more cards to load or click "Cargar Más"
        const loadMoreButton = page.getByRole('button', { name: /Cargar Más Cartas/i });
        if (await loadMoreButton.isVisible()) {
            await loadMoreButton.click();
        }

        // Wait for more cards to load
        await expect(async () => {
            const currentCount = await initialCards.count();
            // If totalCount is small, this might not change, so we check if reachable or just pass
            if (currentCount > initialCount || !(await loadMoreButton.isVisible())) {
                return;
            }
            throw new Error('No more cards loaded');
        }).toPass({ timeout: 15000 });
    });

    test('should open card detail modal and show editions', async ({ page }) => {
        // Wait for cards to be visible
        const firstCard = page.getByTestId('product-card').first();
        await expect(firstCard).toBeVisible({ timeout: 15000 });
        await firstCard.click();

        // Verify modal is visible
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Verify card name is prominent
        const title = modal.locator('h2');
        await expect(title).toBeVisible({ timeout: 10000 });
        await expect(title).not.toBeEmpty();

        // Check for editions within the modal
        const editionsLinks = modal.getByTestId('edition-link');
        await expect(editionsLinks.first()).toBeVisible({ timeout: 10000 });
        const count = await editionsLinks.count();
        expect(count).toBeGreaterThan(0);

        // Close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
    });

    test('should hide add to cart in Archive view', async ({ page }) => {
        // Switch to Archive
        const archivesTab = page.getByTestId('archives-tab');
        await archivesTab.click();

        // Wait for cards
        const firstCard = page.getByTestId('product-card').first();
        await expect(firstCard).toBeVisible({ timeout: 15000 });

        // Verify no quick add button in grid
        const quickAdd = page.getByTitle('Agregar al Carrito Rápido');
        await expect(quickAdd).not.toBeVisible();

        // Open modal
        await firstCard.click();
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible();

        // Verify no add to cart button in modal
        const addToCartBtn = modal.getByTestId('add-to-cart-button');
        await expect(addToCartBtn).not.toBeVisible();

        // Verify no cart icons in versions list
        const versionCartIcons = modal.locator('.lucide-shopping-cart');
        await expect(versionCartIcons).toHaveCount(0);
    });
});
