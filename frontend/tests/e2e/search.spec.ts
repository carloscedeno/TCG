import { test, expect } from '@playwright/test';

test.describe('Search & Filter System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should show autocomplete suggestions', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/Buscar|Search/i);
        await searchInput.fill('Sol');

        // Wait for suggestions
        const suggestions = page.locator('.suggestions-list, [role="listbox"]');
        await expect(suggestions).toBeVisible();

        // Verify specific suggestion (e.g., Sol Ring)
        await expect(suggestions).toContainText(/Sol/i);
    });

    test('should apply advanced filters', async ({ page }) => {
        // Open filters if necessary
        const filterToggle = page.getByRole('button', { name: /Filtros|Filters/i });
        if (await filterToggle.isVisible()) {
            await filterToggle.click();
        }

        // Select Rarity: Rare
        const rarityFilter = page.getByLabel(/Rareza|Rarity/i);
        const tagName = await rarityFilter.evaluate(e => e.tagName);
        if (tagName === 'SELECT') {
            await rarityFilter.selectOption({ label: 'Rare' });
        } else {
            await page.getByText('Rare', { exact: true }).click();
        }

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
        const searchInput = page.getByPlaceholder(/Buscar|Search/i);
        await searchInput.fill('XYZABC123INVALID');
        await searchInput.press('Enter');

        await expect(page.locator('body')).toContainText(/No se encontraron|No results/i);
    });
});
