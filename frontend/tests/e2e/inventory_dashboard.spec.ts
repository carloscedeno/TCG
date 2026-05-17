import { test, expect } from '@playwright/test';

test.describe('Professional Inventory Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Navigating with absolute path to ensure accuracy
        await page.goto('/admin/inventory');
        await page.waitForLoadState('networkidle');
    });

    test('should have a high-end designer UI and layout', async ({ page }) => {
        // Flexible check for h1 content
        const header = page.locator('h1');
        await expect(header).toContainText(/Global/i, { timeout: 10000 });
        await expect(header).toContainText(/Inventario/i);
    });

    test('should show batch actions bar when items are selected', async ({ page }) => {
        // Wait for table to load
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        // Select first item - using the checkbox button
        const firstRow = page.locator('tbody tr').first();
        await firstRow.locator('td').first().locator('button').click();

        // Action bar should appear
        await expect(page.locator('text=Nodos Seleccionados')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=1 Artículos')).toBeVisible();

        // Clear selection via the X button in the batch bar
        await page.locator('.sticky button').last().click();
        await expect(page.locator('text=Nodos Seleccionados')).not.toBeVisible();
    });

    test('should open Add Product Drawer and search for cards', async ({ page }) => {
        await page.getByRole('button', { name: /Agregar Producto/i }).click();

        // Drawer should be visible
        await expect(page.locator('h2')).toContainText(/Agregar Producto/i, { timeout: 10000 });

        // Search in drawer
        const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
        await searchInput.fill('Lotus');

        // Wait for results - using a more generic selector if needed
        await expect(page.locator('button:has-text("Lotus")').first()).toBeVisible({ timeout: 15000 });
        await page.locator('button:has-text("Lotus")').first().click();

        // Selection preview should show
        await expect(page.locator('text=Identificar Carta').locator('..').locator('text=Lotus')).toBeVisible();
    });

    test('should perform inline price editing', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const firstPriceButton = page.locator('tbody tr').first().locator('button.font-mono').first();
        await firstPriceButton.click();

        const priceInput = page.locator('input[type="number"]');
        await expect(priceInput).toBeVisible();

        // Set new price
        await priceInput.fill('99.99');
        await page.keyboard.press('Enter');

        // Verify optimistic update / save badge
        await expect(page.locator('text=GUARDADO')).toBeVisible({ timeout: 10000 });
        await expect(firstPriceButton).toContainText('99.99');
    });

    test('should adjust stock using quick-adjust buttons', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const firstRow = page.locator('tbody tr').first();
        const stockDisplay = firstRow.locator('.font-mono').last();
        const initialStockText = await stockDisplay.textContent();
        const initialStock = parseInt(initialStockText || "0");

        // Increment
        await firstRow.locator('button:has-text("+")').click();
        await expect(stockDisplay).toHaveText((initialStock + 1).toString(), { timeout: 10000 });

        // Decrement
        await firstRow.locator('button:has-text("-")').click();
        await expect(stockDisplay).toHaveText(initialStock.toString(), { timeout: 10000 });
    });
});
