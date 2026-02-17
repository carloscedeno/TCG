
import { test, expect } from '@playwright/test';

test.describe('Mana Symbol Comprehensive Test', () => {
    test.beforeEach(async ({ page }) => {
        // Mock get_unique_cards_optimized RPC for Home grid
        await page.route('**/rest/v1/rpc/get_unique_cards_optimized', async route => {
            const json = [{
                printing_id: 'comprehensive-test-card',
                card_name: 'All Symbols Card',
                set_name: 'Test Set',
                set_code: 'TST',
                image_url: 'https://example.com/card.jpg',
                avg_market_price_usd: 10,
                rarity: 'Rare',
                type_line: 'Symbol Creature',
                cmc: 5,
                game_id: 1,
                colors: ['W', 'U', 'B', 'R', 'G'],
                release_date: '2023-01-01',
                total_stock: 5,
                finish: 'nonfoil',
                is_foil: false,
                mana_cost: '{W}{U}{B}{R}{G}{C}{S}{X}{Y}{Z}{0}{1}{20}{100}{∞}{1/2}{TK}{H}',
                oracle_text: '{T} {Q} {E} {PW} {CHAOS} {A} {W/U} {2/b} {G/U/P} {W/P}'
            }];
            await route.fulfill({ json });
        });

        // Mock card details logic
        await page.route('**/api/cards/comprehensive-test-card', async route => {
            await route.fulfill({
                json: {
                    card: {
                        card_id: 'comprehensive-test-card',
                        name: 'All Symbols Card',
                        mana_cost: '{W}{U}{B}{R}{G}{C}{S}{X}{Y}{Z}{0}{1}{20}{100}{∞}{1/2}{TK}{H}',
                        type_line: 'Symbol Creature',
                        oracle_text: '{T} {Q} {E} {PW} {CHAOS} {A} {W/U} {2/B} {G/U/P} {W/P}',
                        flavor_text: 'A test of all symbols.',
                        set_name: 'Test Set',
                        set_code: 'TST',
                        collector_number: '999',
                        rarity: 'Mythic',
                        image_url: 'https://example.com/card.jpg',
                        artist: 'Tester',
                        colors: ['W', 'U', 'B', 'R', 'G'],
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

    test('should render all mana symbols correctly', async ({ page }) => {
        // Wait for card to appear
        const card = page.locator('[data-testid="product-card"]').first();
        await expect(card).toBeVisible();
        await card.click({ force: true });

        const modal = page.locator('[data-testid="card-modal"]');
        await expect(modal).toBeVisible();

        const manaCostContainer = modal.locator('span.text-white\\/80');
        const oracleTextContainer = modal.locator('.whitespace-pre-wrap');

        // Verify Basic Colors & Colorless
        await expect(manaCostContainer.locator('.ms-w')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-u')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-b')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-r')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-g')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-c')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-s')).toBeAttached(); // Snow

        // Verify Variables & Numbers
        await expect(manaCostContainer.locator('.ms-x')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-y')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-z')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-0')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-1')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-20')).toBeAttached();
        await expect(manaCostContainer.locator('.ms-100')).toBeAttached();

        // Verify Special/Funny
        await expect(manaCostContainer.locator('.ms-infinity')).toBeAttached(); // Infinity
        await expect(manaCostContainer.locator('.ms-1-2')).toBeAttached(); // Half
        await expect(manaCostContainer.locator('.ms-tk')).toBeAttached(); // Ticket
        await expect(manaCostContainer.locator('.ms-h')).toBeAttached(); // Half generic?

        // Verify Oracle Text Symbols
        await expect(oracleTextContainer.locator('.ms-tap')).toBeAttached();
        await expect(oracleTextContainer.locator('.ms-untap')).toBeAttached();
        await expect(oracleTextContainer.locator('.ms-e')).toBeAttached(); // Energy
        await expect(oracleTextContainer.locator('.ms-planeswalker')).toBeAttached();
        await expect(oracleTextContainer.locator('.ms-chaos')).toBeAttached();
        await expect(oracleTextContainer.locator('.ms-acorn')).toBeAttached();

        // Verify Hybrid / Phyrexian via Class Logic
        // {W/U} -> ms-wu
        await expect(oracleTextContainer.locator('.ms-wu')).toBeAttached();
        // {2/B} -> ms-2b
        await expect(oracleTextContainer.locator('.ms-2b')).toBeAttached();
        // {G/U/P} -> ms-gup (Phyrexian Hybrid)
        await expect(oracleTextContainer.locator('.ms-gup')).toBeAttached();
        // {W/P} -> ms-wp (Phyrexian)
        await expect(oracleTextContainer.locator('.ms-wp')).toBeAttached();

        // Screenshot for visual verification
        await page.screenshot({ path: 'frontend/mana-symbols-comprehensive.png', fullPage: true });
    });
});
