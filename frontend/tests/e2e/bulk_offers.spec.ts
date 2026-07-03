import { test, expect } from '@playwright/test';

test.describe('Bulk Rarity Discounts', () => {
  // Use admin auth
  test.use({ storageState: 'test-results/auth.setup.ts-authenticate-as-admin-setup/state.json' });

  test('should open Bulk Rarity Offer Modal and apply a discount', async ({ page }) => {
    await page.goto('/admin/inventory');
    
    // Wait for the inventory to load
    await page.waitForSelector('table');
    
    // Find and click the Bulk Offers button
    const bulkButton = page.getByRole('button', { name: /Ofertas \(Bulk\)/i });
    await bulkButton.click();
    
    // The modal should appear
    const modalHeading = page.getByRole('heading', { name: /Ofertas por Rareza \(Masivo\)/i });
    await expect(modalHeading).toBeVisible();
    
    // Select Mythic
    await page.getByRole('combobox').selectOption('mythic');
    
    // Enter discount percentage
    await page.getByRole('spinbutton').fill('15');
    
    // Enter end date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    // The date input is a bit tricky to fill directly with Playwright sometimes if it's type="date",
    // but .fill() usually works if the format is YYYY-MM-DD
    const dateInputs = await page.locator('input[type="date"]');
    await dateInputs.fill(dateString);
    
    // Check include foil
    const includeFoilCheck = page.locator('input[type="checkbox"]').nth(1);
    await includeFoilCheck.check();
    
    // Click Apply
    const applyButton = page.getByRole('button', { name: /Aplicar 15%/i });
    
    // We mock the alert to avoid it blocking the test
    page.once('dialog', dialog => dialog.accept());
    
    await applyButton.click();
    
    // Modal should close
    await expect(modalHeading).not.toBeVisible();
  });
});
