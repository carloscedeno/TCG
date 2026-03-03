import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Bulk Import CSV/TXT Verification', () => {
    test('should detect and map ManaBox CSV correctly', async ({ page }) => {
        // Navigate to bulk import (assuming standard local route)
        await page.goto('/import');

        // Check if the user is logged in, or mock session if needed
        // For this verification, we focus on the UI mapping logic

        const csvContent = `Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency
"Abyssal Persecutor",WWK,"Worldwake",47,normal,mythic,1,64353,747d3d1f-8182-429a-b31c-62383f0f7871,1,false,false,near_mint,English,USD`;

        const filePath = path.join(__dirname, 'test_manabox.csv');
        fs.writeFileSync(filePath, csvContent);

        // Upload file
        await page.setInputFiles('input[type="file"]', filePath);

        // Verify detection
        await expect(page.locator('text=Formato Detectado Automáticamente')).toBeVisible();
        await expect(page.locator('text=ManaBox')).toBeVisible();
        await expect(page.locator('text=Abyssal Persecutor')).toBeVisible();

        // Verify auto-mapping fields (visual check in table)
        await expect(page.locator('table')).toContainText('WWK');
        await expect(page.locator('table')).toContainText('47');

        fs.unlinkSync(filePath);
    });

    test('should detect and map Special TXT correctly', async ({ page }) => {
        await page.goto('/import');

        const txtContent = `1 Agatha's Soul Cauldron (WOE) 242 *F*`;
        const filePath = path.join(__dirname, 'test_special.txt');
        fs.writeFileSync(filePath, txtContent);

        await page.setInputFiles('input[type="file"]', filePath);

        await expect(page.locator('text=Formato Detectado Automáticamente')).toBeVisible();
        await expect(page.locator('text=Agatha\'s Soul Cauldron')).toBeVisible();
        await expect(page.locator('text=WOE')).toBeVisible();
        await expect(page.locator('text=FOIL')).toBeVisible();

        fs.unlinkSync(filePath);
    });
});
