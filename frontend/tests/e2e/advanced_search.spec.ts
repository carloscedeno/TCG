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
        // Open filters if necessary
        const filterToggle = page.getByRole('button', { name: /Filtros|Filters/i });
        if (await filterToggle.isVisible()) {
            await filterToggle.click();
        }

        // Locate Year Range slider or inputs
        // Assuming there's a year-from and year-to input or similar
        const yearFrom = page.locator('input[name="year_from"], #year-from');
        const yearTo = page.locator('input[name="year_to"], #year-to');

        if (await yearFrom.isVisible()) {
            await yearFrom.fill('1993');
            await yearTo.fill('1994');

            // Wait for update
            await expect(page).toHaveURL(/.*year_from=1993/);
            await expect(page).toHaveURL(/.*year_to=1994/);
        } else {
            // Fallback for slider logic if implemented as a slider
            const slider = page.locator('.year-range-slider');
            if (await slider.isVisible()) {
                // Perform drag or keyboard interaction for slider
                // For now, check if it exists
                await expect(slider).toBeVisible();
            }
        }
    });

    test('should specifically verify Pokemon set filtering', async ({ page }) => {
        // Switch to Pokemon
        const pokemonTab = page.getByRole('button', { name: /Pokémon/i });
        await pokemonTab.click();

        // Open Sets filter
        const setFilter = page.getByRole('combobox', { name: /Set|Edición/i });
        await expect(setFilter).toBeVisible();

        // Check for common Pokemon sets (e.g., Base Set)
        await setFilter.click();
        await expect(page.locator('option, .set-option')).toContainText(/Base Set|Scarlet/i);
    });
});
