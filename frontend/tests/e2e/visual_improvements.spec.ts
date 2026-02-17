
import { test, expect } from '@playwright/test';

test.describe('Visual & Functional Improvements (PRD v2.0)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock default cards response
        await page.route('**/rest/v1/rpc/get_unique_cards_optimized', async route => {
            const json = [{
                printing_id: 'foil-card-id',
                card_name: 'Foil Lotus',
                set_name: 'Alpha',
                set_code: 'LEA',
                image_url: 'https://example.com/foil.jpg',
                avg_market_price_usd: 1000,
                rarity: 'Mythic',
                type_line: 'Artifact',
                cmc: 0,
                game_id: 1,
                colors: [],
                release_date: '1993-08-05',
                total_stock: 5,
                finish: 'foil',
                is_foil: true
            }, {
                printing_id: 'regular-card-id',
                card_name: 'Regular Bear',
                set_name: 'Beta',
                set_code: 'LEB',
                image_url: 'https://example.com/bear.jpg',
                avg_market_price_usd: 0.5,
                rarity: 'Common',
                type_line: 'Creature',
                cmc: 2,
                game_id: 1,
                colors: ['G'],
                release_date: '1993-10-04',
                total_stock: 10,
                finish: 'nonfoil',
                is_foil: false,
                mana_cost: '{1}{G}',
                oracle_text: '{T}: Add {G}.'
            }];
            await route.fulfill({ json });
        });

        // Mock Cart response
        await page.route('**/rest/v1/rpc/get_user_cart', async route => {
            await route.fulfill({ json: [] });
        });

        // Mock Products for inventory tab
        await page.route('**/rest/v1/rpc/get_products_filtered', async route => {
            const json = [{
                printing_id: 'foil-card-id',
                card_name: 'Foil Lotus',
                set_name: 'Alpha',
                set_code: 'LEA',
                image_url: 'https://example.com/foil.jpg',
                avg_market_price_usd: 1000,
                rarity: 'Mythic',
                type_line: 'Artifact',
                cmc: 0,
                game_id: 1,
                colors: [],
                release_date: '1993-08-05',
                total_stock: 5,
                finish: 'foil',
                is_foil: true
            }, {
                printing_id: 'regular-card-id',
                card_name: 'Regular Bear',
                set_name: 'Beta',
                set_code: 'LEB',
                image_url: 'https://example.com/bear.jpg',
                avg_market_price_usd: 0.5,
                rarity: 'Common',
                type_line: 'Creature',
                cmc: 2,
                game_id: 1,
                colors: ['G'],
                release_date: '1993-10-04',
                total_stock: 10,
                finish: 'nonfoil',
                is_foil: false,
                mana_cost: '{1}{G}',
                oracle_text: '{T}: Add {G}.'
            }];
            await route.fulfill({ json });
        });

        // Mock add_to_cart
        await page.route('**/rest/v1/rpc/add_to_cart', async route => {
            await route.fulfill({ json: { success: true } });
        });

        // Mock Card Details for Modal
        await page.route('**/api/cards/regular-card-id', async route => {
            await route.fulfill({
                json: {
                    card: {
                        card_id: 'regular-card-id',
                        name: 'Regular Bear',
                        mana_cost: '{1}{G}', // Mana symbols to be rendered
                        type_line: 'Creature',
                        oracle_text: '{T}: Add {G}.', // Mana symbols to be rendered
                        flavor_text: 'Roar.',
                        set_name: 'Beta',
                        set_code: 'LEB',
                        collector_number: '222',
                        rarity: 'Common',
                        image_url: 'https://example.com/bear.jpg',
                        artist: 'Artist Name',
                        colors: ['G'],
                        all_versions: []
                    }
                }
            });
        });

        // Suppress Welcome Modal
        await page.addInitScript(() => {
            sessionStorage.setItem('hasSeenWelcomeModal', 'true');
        });

        await page.goto('/');
    });

    test('TEST-01: Typography and Colors', async ({ page }) => {
        const body = page.locator('body');
        await expect(body).toHaveCSS('background-color', 'rgb(31, 24, 45)');
    });

    test('TEST-03: Foil Distinction', async ({ page }) => {
        await expect(page.getByTestId('product-card').first()).toBeVisible();
        const foilCard = page.locator('[data-testid="product-card"]').filter({ hasText: 'Foil Lotus' });
        await expect(foilCard).toBeVisible();
        await expect(foilCard.getByText('Foil', { exact: true })).toBeVisible();

        const regularCard = page.locator('[data-testid="product-card"]').filter({ hasText: 'Regular Bear' });
        await expect(regularCard).toBeVisible();
        await expect(regularCard.getByText('Foil', { exact: true })).not.toBeVisible();
    });

    test('TEST-04: Quick Add to Cart', async ({ page }) => {
        const card = page.locator('[data-testid="product-card"]').first();
        await expect(card).toBeVisible();

        // Hover to trigger UI state change
        await card.hover();

        // Wait for potential re-render/transition
        await page.waitForTimeout(500);

        // Locate button after hover state is applied
        const quickAddBtn = card.locator('button[title="Agregar al Carrito Rápido"]');

        // Ensure it's attached
        await expect(quickAddBtn).toBeAttached();

        // Click with force
        await quickAddBtn.click({ force: true });
    });

    test('TEST-05 & TEST-07: Mobile View - Header & QTY', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const header = page.locator('header');
        await expect(header).toBeVisible();

        // "El Emporio" should be hidden. 
        // We use a selector that targets the span directly.
        // The span has class "hidden md:inline".
        // We can check if that span is hidden.
        const elEmporioSpan = header.locator('span:has-text("El Emporio")');
        // If the text includes nbsp, we might need a regex
        // The implementation: <span ...>&nbsp;El Emporio</span>

        await expect(elEmporioSpan).toBeHidden();

        await expect(page.getByTestId('product-card').first()).toBeVisible();

        // Check for "DISP:" label
        // It should be visible
        const stockLabel = page.getByText(/DISP:/).first();
        await expect(stockLabel).toBeVisible();
    });

    test('TEST-08: Social Media Links', async ({ page }) => {
        const discordLink = page.locator('a[href*="discord.gg"]').first();
        await expect(discordLink).toBeVisible();
    });

    test('TEST-06: Mobile List View - Name Wrapping', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Switch to List View (if available on mobile? Buttons might be hidden or different)
        // Home.tsx shows layout toggle is inside a div that is generally visible.

        // Use title selector as established
        const listViewBtn = page.locator('button[title="List View"]');

        // Check visibility first
        await expect(listViewBtn).toBeVisible();
        await listViewBtn.click();

        // Wait for list view render
        // Check first card name
        const cardName = page.locator('.flex.flex-col.gap-2 h3').first();

        // It should NOT have 'truncate' class
        await expect(cardName).not.toHaveClass(/truncate/);

        // It should be visible
        await expect(cardName).toBeVisible();
    });

});
