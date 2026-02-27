import { test, expect } from '@playwright/test';

test.describe('V4 Pending Features validation', () => {

    test.beforeEach(async ({ page }) => {
        // Mock initial card list
        await page.route('**/rpc/get_unique_cards_optimized*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: [
                    {
                        printing_id: 'fake-printing',
                        card_name: 'Test Setup Card',
                        set_name: 'Test Set',
                        set_code: 'SET',
                        image_url: 'https://example.com/image.jpg',
                        price: 10,
                        stock: 5,
                        rarity: 'Rare'
                    }
                ]
            });
        });

        // Mock search suggestions
        await page.route('**/rpc/search_card_names*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: [
                    { card_name: 'Boomerang' },
                    { card_name: 'Test Setup Card' }
                ]
            });
        });

        await page.route('**/rpc/add_to_cart*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: { success: true }
            });
        });

        await page.route('**/rpc/get_user_cart*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: [
                    {
                        cart_item_id: 'cart-1',
                        printing_id: 'fake-printing',
                        quantity: 1,
                        product_name: 'Test Setup Card',
                        price: 10,
                        image_url: 'https://example.com/image.jpg',
                        set_code: 'SET',
                        stock: 1
                    }
                ]
            });
        });

        // Mock order creation RPC
        await page.route('**/rpc/create_order_atomic*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 201,
                json: [{ id: 'internal-id', order_id: 'ORD-12345', status: 'PENDING' }]
            });
        });

        // Bypass WelcomeModal before navigation
        await page.addInitScript(() => {
            window.sessionStorage.setItem('hasSeenWelcomeModal', 'true');
        });

        await page.goto('/');
    });

    test('should prevent adding more quantity than available stock in CartDrawer', async ({ page }) => {
        // Intercept real card_printings request and mock it entirely
        await page.route('**/api/cards/*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: {
                    name: 'Test Setup Card',
                    finishes: ['nonfoil', 'foil'],
                    all_versions: [
                        { id: 'fake-printing', set_code: 'SET', is_foil: false, price: 10, stock: 1 },
                        { id: 'fake-printing-foil', set_code: 'SET', is_foil: true, price: 15, stock: 0 }
                    ],
                    printing_id: 'fake-printing',
                    image_url: 'https://example.com/image.jpg'
                }
            });
        });

        // Find the first valid card
        const firstCard = page.getByTestId('product-card').first();
        await expect(firstCard).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(500); // stable wait

        // Click inner image container
        const cardInner = firstCard.locator('div.relative.aspect-\\[2\\.5\\/3\\.5\\]').first();
        await cardInner.click({ force: true });

        // Wait for modal
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible({ timeout: 10000 });

        // Add to cart.
        const addToCartBtn = modal.getByRole('button', { name: /Agregar al carrito/i });
        await expect(addToCartBtn).toBeVisible();
        await addToCartBtn.click();

        await page.waitForTimeout(1000); // let cart update

        // Open cart drawer
        const cartButton = page.locator('button').filter({ has: page.locator('svg.lucide-shopping-cart') }).first();
        await cartButton.click();

        // Wait for Cart Drawer
        const cartDrawer = page.locator('[data-testid="cart-drawer"]').first();
        await expect(cartDrawer).toBeVisible();

        // Find the increase button and verify it is disabled (since stock is 1 and quantity is 1)
        const increaseBtn = cartDrawer.getByTestId('increase-quantity-button').first();
        await expect(increaseBtn).toBeDisabled();
    });

    test('should format WhatsApp message correctly on Checkout', async ({ page }) => {
        await page.route('**/api/cards/*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: {
                    name: 'Checkout Test Card',
                    finishes: ['nonfoil', 'foil'],
                    all_versions: [
                        { id: 'fake-printing-2', set_code: 'SET', is_foil: false, price: 10, stock: 5 },
                        { id: 'fake-printing-2-foil', set_code: 'SET', is_foil: true, price: 15, stock: 5 }
                    ],
                    printing_id: 'fake-printing-2',
                    image_url: 'https://example.com/image.jpg'
                }
            });
        });

        // Wait for cards 
        const firstCard = page.getByTestId('product-card').first();
        await expect(firstCard).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(500);

        // Click inner image container
        const cardInner = firstCard.locator('div.relative.aspect-\\[2\\.5\\/3\\.5\\]').first();
        await cardInner.click({ force: true });

        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible({ timeout: 10000 });

        const addToCartBtn = modal.getByRole('button', { name: /Agregar al carrito/i });
        await expect(addToCartBtn).toBeVisible();
        await addToCartBtn.click();

        await page.waitForTimeout(1000);

        // Go to checkout
        await page.goto('/checkout');
        await page.evaluate(() => {
            window.sessionStorage.setItem('hasSeenWelcomeModal', 'true');
        });

        await expect(page.getByRole('heading', { name: /Datos del Cliente/i })).toBeVisible({ timeout: 10000 });

        // Fill out checkout form
        await page.getByLabel(/Nombre Completo/i).fill('Test User');
        await page.getByLabel(/Email/i).fill('test@example.com');
        await page.getByLabel(/Número de WhatsApp/i).fill('04141234567');
        await page.getByLabel(/Dirección de Entrega/i).fill('Av. Principal 123');
        await page.getByLabel(/Estado/i).selectOption('Distrito Capital');
        await page.getByLabel(/Cédula de Identidad/i).fill('12345678');

        // Continue to payment method
        await page.getByRole('button', { name: /Continuar al Pago/i }).click();

        await expect(page.getByRole('heading', { name: /Método de Pago/i })).toBeVisible();

        // Mock order creation RPC
        await page.route('**/rest/v1/rpc/create_order_atomic*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 200,
                json: { order_id: 'ORD-12345', success: true }
            });
        });

        await page.route('**/rest/v1/orders*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 201,
                json: [{ id: 'internal-id', order_id: 'ORD-12345', status: 'PENDING' }]
            });
        });

        const placeOrderBtn = page.getByTestId('place-order-button');

        // WhatsApp link logic
        const [popup] = await Promise.all([
            page.waitForEvent('popup'),
            placeOrderBtn.click()
        ]);

        const url = popup.url();
        expect(url).toMatch(/wa\.me|api\.whatsapp\.com/);
        expect(url).toMatch(/Test(%20|\+)User/);
        expect(url).toContain('12345'); // Check order id injection

        await popup.close();
    });

    test('should apply constraint classes to CardModal version list', async ({ page }) => {
        await page.route('**/api/cards/*', async route => {
            if (route.request().method() === 'OPTIONS') {
                return route.continue();
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: {
                    name: 'Test Setup Card',
                    finishes: ['nonfoil', 'foil'],
                    all_versions: Array(10).fill(null).map((_, i) => ({
                        printing_id: `fake-printing-${i}`,
                        set_code: `S${i}`,
                        set_name: `Set ${i}`,
                        collector_number: `${i + 1}`,
                        is_foil: false,
                        price: 10.00,
                        stock: 5
                    })),
                    printing_id: 'fake-printing-0',
                    image_url: 'https://example.com/image.jpg'
                }
            });
        });

        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

        // Set mobile viewport to ensure constraint class is active
        await page.setViewportSize({ width: 375, height: 667 });

        const firstCard = page.getByTestId('product-card').first();
        await expect(firstCard).toBeVisible({ timeout: 15000 });
        // Click the card to open modal
        await firstCard.click();

        // Check modal
        const modal = page.getByTestId('card-modal');
        await expect(modal).toBeVisible({ timeout: 15000 });

        // Wait for versions container (it should be there even in skeleton state)
        const container = modal.getByTestId('versions-list-container');
        await expect(container).toBeVisible({ timeout: 15000 });
    });
});
