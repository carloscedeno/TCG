import { test, expect } from '@playwright/test';

test.describe('Advanced Search & Filtering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should support boolean search logic (AND)', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/Buscar cartas|Search/i);

        // Search for "Lotus AND Black"
        await searchInput.fill('Lotus AND Black');
        await searchInput.press('Enter');

        // Wait for results
        const results = page.locator('.card-item');
        await expect(results.first()).toBeVisible();

        // Verify multiple matches contain both terms
        const firstCardText = await results.first().innerText();
        expect(firstCardText.toLowerCase()).toContain('lotus');
        expect(firstCardText.toLowerCase()).toContain('black');
    });

    test('should filter by year range', async ({ page }) => {
        // Open Year filter section
        const yearToggle = page.getByRole('button', { name: /Año/i });
        await yearToggle.click();

        // Locate Year Range inputs
        const yearFrom = page.getByPlaceholder('Desde');
        const yearTo = page.getByPlaceholder('Hasta');

        await expect(yearFrom).toBeVisible();
        await yearFrom.fill('2020');
        await yearTo.fill('2025');
    });

    test('should specifically verify Pokemon set filtering', async ({ page }) => {
        // Switch to Pokemon
        const pokemonTab = page.getByRole('button', { name: /Pokémon/i });
        await pokemonTab.click();

        // Open Sets filter section if not expanded
        const setsToggle = page.getByRole('button', { name: /Expansión \/ Set/i });
        await setsToggle.click();

        // Search for Pokemon set
        const setSearch = page.getByPlaceholder('Buscar sets...');
        await expect(setSearch).toBeVisible();
        await setSearch.fill('Crown');

        // Check for matching Pokemon set in the filtered list
        await expect(page.getByText('Crown Zenith')).toBeVisible();
    });
});
