import { test, expect } from '@playwright/test';

test.describe('Bulk Import CSV/TXT Verification', () => {
    test('should detect and map ManaBox CSV correctly', async ({ page }) => {
        await page.goto('/import');

        // We use a simpler data-set to verify the UI detection logic
        // Mocking the file upload by creating a DataTransfer object or using setInputFiles with a virtual file
        const csvContent = 'Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency\n"Abyssal Persecutor",WWK,"Worldwake",47,normal,mythic,1,64353,747d3d1f-8182-429a-b31c-62383f0f7871,1,false,false,near_mint,English,USD';

        const dataTransfer = await page.evaluateHandle((content) => {
            const dt = new DataTransfer();
            const file = new File([content], 'test_manabox.csv', { type: 'text/csv' });
            dt.items.add(file);
            return dt;
        }, csvContent);

        await page.dispatchEvent('input[type="file"]', 'drop', { dataTransfer });

        // Verify detection
        await expect(page.locator('text=Formato Detectado Automáticamente')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=ManaBox')).toBeVisible();
        await expect(page.locator('table')).toContainText('WWK');
        await expect(page.locator('table')).toContainText('47');
    });

    test('should detect and map Special TXT correctly', async ({ page }) => {
        await page.goto('/import');

        const txtContent = `1 Agatha's Soul Cauldron (WOE) 242 *F*`;

        const dataTransfer = await page.evaluateHandle((content) => {
            const dt = new DataTransfer();
            const file = new File([content], 'test_special.txt', { type: 'text/plain' });
            dt.items.add(file);
            return dt;
        }, txtContent);

        await page.dispatchEvent('input[type="file"]', 'drop', { dataTransfer });

        await expect(page.locator('text=Formato Detectado Automáticamente')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Agatha\'s Soul Cauldron')).toBeVisible();
        await expect(page.locator('text=WOE')).toBeVisible();
        await expect(page.locator('text=FOIL')).toBeVisible();
    });
});
