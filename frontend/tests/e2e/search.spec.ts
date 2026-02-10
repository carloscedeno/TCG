import { test, expect } from '@playwright/test';

test.describe('Search & Filter System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should show autocomplete suggestions', async ({ page }) => {
        // Wait for products to load first
        await expect(page.getByText(/Invocando Cartas|Loading/i)).not.toBeVisible();

        // Use .first() to avoid strict mode issues if multiple inputs exist (responsive)
        // Use .first() to avoid strict mode issues if multiple inputs exist (responsive)
        const searchInput = page.getByPlaceholder(/Buscar|Search/i).first();
        await searchInput.click();

        // Wait for RPC response (wait for network request to complete)
        const responsePromise = page.waitForResponse(resp => resp.url().includes('search_card_names') && resp.status() === 200);

        await searchInput.fill('Super'); // Use 'Super' for Super-Skrull

        await responsePromise; // Ensure data is loaded

        // Wait for suggestions
        const suggestions = page.getByTestId('suggestions-list');
        await expect(suggestions).toBeVisible();

        // Verify specific suggestion (e.g., Super-Skrull)
        await expect(suggestions.locator('button').first()).toContainText(/Super/i);
    });

    test('should apply advanced filters', async ({ page }) => {
        // Open filters if necessary
        const filterToggle = page.getByRole('button', { name: /Filtros|Filters/i });
        if (await filterToggle.isVisible()) {
            await filterToggle.click();
        }

        // Select Rarity: Rare (Spanish: Rara)
        // Directly target the button as we know desktop uses buttons
        await page.getByRole('button', { name: /Rara|Rare/i }).first().click();

        // Verify URL contains rarity
        await expect(page).toHaveURL(/.*rarity=rare/i);
    });

    test('should sort results by price', async ({ page }) => {
        const sortSelect = page.locator('select').filter({ hasText: /Ordenar|Sort/i }).first();
        if (await sortSelect.isVisible()) {
            await sortSelect.selectOption('price_asc');
            await expect(page).toHaveURL(/.*sort=price_asc/i);
        }
    });

    test('should show empty state for non-matching search', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/Buscar|Search/i).first();
        await searchInput.fill('XYZABC123INVALID');
        await searchInput.press('Enter');

        // Wait for loading to finish
        await expect(page.getByText(/Invocando Cartas|Loading/i)).not.toBeVisible();

        // Verify no card items found
        await expect(page.locator('.card-item')).toHaveCount(0);
        // Verify message if visible
        // await expect(page.locator('body')).toContainText(/No se encontraron|No results/i);
    });
});
