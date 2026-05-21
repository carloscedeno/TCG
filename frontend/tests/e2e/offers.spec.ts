import { test, expect } from '@playwright/test';

test.describe('Offer Management (Descuentos)', () => {
    test.describe.configure({ retries: 2 });
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin/inventory');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText(/Inventario/i, { timeout: 15000 });
        await page.waitForFunction(() => {
            const hasData = document.querySelector('tbody tr') !== null;
            const isEmpty = document.body.textContent?.includes('Nodo de Inventario Vacío') === true;
            return hasData || isEmpty;
        }, { timeout: 25000 });
    });

    test('should show +% dashed button on items without discount', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const addOfferBtn = page.locator('button:has-text("+ %")').first();
        await expect(addOfferBtn).toBeVisible();
        await expect(addOfferBtn).toHaveClass(/border-dashed/);
    });

    test('should open offer modal from +% button and apply discount', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const addOfferBtn = page.locator('button:has-text("+ %")').first();
        await addOfferBtn.click();

        await expect(page.getByText('Gestionar Oferta')).toBeVisible();

        const pctInput = page.getByPlaceholder('Ej:');
        await expect(pctInput).toBeVisible();
        await pctInput.fill('15');

        const dateInput = page.locator('input[type="date"]');
        await expect(dateInput).toBeVisible();

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const dateStr = futureDate.toISOString().split('T')[0];
        await dateInput.fill(dateStr);

        await page.getByRole('button', { name: /Aplicar/i }).click();

        await expect(page.getByText('Gestionar Oferta')).not.toBeVisible({ timeout: 10000 });
    });

    test('should open offer modal from Tag icon in Ops column', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const opsButtons = page.locator('tbody tr').first().locator('td').last().locator('button');
        await expect(opsButtons.first()).toBeVisible();

        await opsButtons.first().click();
        await expect(page.getByText('Gestionar Oferta')).toBeVisible();
    });

    test('should show discounted price with strikethrough when offer is active', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const addOfferBtn = page.locator('button:has-text("+ %")').first();
        await addOfferBtn.click();

        await expect(page.getByText('Gestionar Oferta')).toBeVisible();
        const pctInput = page.getByPlaceholder('Ej:');
        await pctInput.fill('20');

        const dateInput = page.locator('input[type="date"]');
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        await dateInput.fill(futureDate.toISOString().split('T')[0]);

        await page.getByRole('button', { name: /Aplicar/i }).click();
        await expect(page.getByText('Gestionar Oferta')).not.toBeVisible({ timeout: 10000 });

        await expect(page.locator('span.line-through').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('-20%').first()).toBeVisible();
    });

    test('should remove an active offer and revert to +% button', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const discountBadge = page.locator('button:has-text("-%")').first();
        await discountBadge.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

        if (await discountBadge.isVisible()) {
            await discountBadge.click();
            await expect(page.getByText('Gestionar Oferta')).toBeVisible();
            await page.getByRole('button', { name: /Quitar Oferta/i }).click();
            await expect(page.getByText('Gestionar Oferta')).not.toBeVisible({ timeout: 10000 });
            await expect(page.locator('button:has-text("+ %")').first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('should require end date when percentage > 0', async ({ page }) => {
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

        const addOfferBtn = page.locator('button:has-text("+ %")').first();
        await addOfferBtn.click();

        await expect(page.getByText('Gestionar Oferta')).toBeVisible();
        const pctInput = page.getByPlaceholder('Ej:');
        await pctInput.fill('10');

        const applyBtn = page.getByRole('button', { name: /Aplicar/i });
        await expect(applyBtn).toBeDisabled();
    });
});
