import { test, expect } from '@playwright/test';

test.describe('Checkout Flow with Foil Cards', () => {
    test.beforeEach(async ({ page }) => {
        // Mock initial product list
        await page.route('**/rpc/get_products_filtered*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: [
                    {
                        printing_id: 'fake-boomerang',
                        card_id: 'fake-boomerang',
                        name: 'Boomerang',
                        set_name: 'Test Set',
                        set_code: 'SET',
                        image_url: 'https://example.com/boomerang.jpg',
                        price: 10,
                        stock: 5,
                        rarity: 'Rare'
                    }
                ]
            });
        });

        await page.goto('/');
        await page.evaluate(() => {
            window.sessionStorage.setItem('hasSeenWelcomeModal', 'true');
        });
    });

    test('should search for Boomerang, add foil to cart and verify cart contents', async ({ page }) => {
        await page.route('**/api/cards/*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: {
                    name: 'Boomerang',
                    finishes: ['nonfoil', 'foil'],
                    all_versions: [
                        { printing_id: 'fake-boomerang', set_code: 'SET', set_name: 'Test Set', is_foil: false, price: 5, stock: 10 },
                        { printing_id: 'fake-boomerang-foil', set_code: 'SET', set_name: 'Test Set', is_foil: true, price: 20, stock: 5 }
                    ],
                    printing_id: 'fake-boomerang',
                    image_url: 'https://example.com/boomerang.jpg'
                }
            });
        });

        // 1. Search for Boomerang
        const searchInput = page.getByPlaceholder(/Buscar/i).first();
        await searchInput.click();
        await searchInput.fill('Boomerang');
        await searchInput.press('Enter');

        // Wait for results in product grid
        const card = page.getByTestId('product-card').filter({ hasText: /Boomerang/i }).first();
        await expect(card).toBeVisible({ timeout: 15000 });

        // 2. Click the Boomerang card to open CardDetail
        await card.click();

        // Wait for detail page container
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible({ timeout: 15000 });

        // 3. Select Foil version
        const foilButton = modal.getByRole('button', { name: /Foil/i });
        if (await foilButton.isVisible()) {
            await foilButton.click();
        }

        // 4. Add to cart
        const addToCartBtn = modal.getByTestId('add-to-cart-button');
        await expect(addToCartBtn).toBeVisible();
        await addToCartBtn.click();

        // 5. Open Cart Drawer
        const cartButton = page.getByTestId('cart-button');
        await cartButton.click();

        // Wait for Cart Drawer
        const cartDrawer = page.getByTestId('cart-drawer');
        await expect(cartDrawer).toBeVisible({ timeout: 10000 });

        // 6. Verify item in cart
        const cartItem = cartDrawer.getByTestId('cart-item').filter({ hasText: /Boomerang/i }).first();
        await expect(cartItem).toBeVisible();

        // It should specify it is Foil
        await expect(cartItem).toContainText(/Foil/i);

        // Price should not be $0.00
        const itemPrice = cartItem.locator('.text-sm.font-mono.font-black.text-geeko-cyan');
        await expect(itemPrice).not.toHaveText('$0.00');
    });
});
