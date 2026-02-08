import { test, expect } from '@playwright/test';

test.describe('Business Rules: Deduplication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should only show unique cards (Rule 1: Deduplication)', async ({ page }) => {
        // The rule states that the default grid should filter by the most recent edition.
        // This means if we search for a common card name like "Sol Ring", 
        // we should see distinct names in the initial results, not multiple Sol Rings from different sets.

        const searchInput = page.getByPlaceholder(/Buscar cartas|Search/i);
        await searchInput.fill('Sol Ring');
        await searchInput.press('Enter');

        // Wait for results
        const cardNames = page.locator('.card-item .card-name'); // Adjust selector
        await expect(cardNames.first()).toBeVisible();

        const names = await cardNames.allInnerTexts();

        // Check for duplicates in the displayed names
        const uniqueNames = new Set(names);

        // In a deduplicated environment, we expect fewer results than the total versions,
        // often just one result for a specific search if only unique names are shown.
        // However, some variants might overlap. The key is that the grid *usually* shows one per unique card.
        // We check that at least the top results are not identical printings of the same name.

        // If "Sol Ring" is top, there shouldn't be another "Sol Ring" right next to it 
        // UNLESS the search logic allows multiple versions but the default grid doesn't.
        // The PRD says: "The grid now filters by the most recent edition."

        const solRingCount = names.filter(n => n.includes('Sol Ring')).length;
        // Based on Rule 1, this should be 1 if deduplication is strictly 1:1 by name.
        // If there are multiple, verify they are actually different cards or the rule is failing.
        expect(solRingCount).toBeLessThanOrEqual(1);
    });
});
