import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration — Geekorium
 * - Project `smoke`: Fast public E2E smoke & regression (no admin auth dependency)
 * - Project `chromium`: Full authenticated suite (depends on `setup`)
 */
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    timeout: 60000,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:5174/',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'smoke',
            testMatch: /.*smoke.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        {
            name: 'chromium',
            testIgnore: /.*smoke.*\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:5174/',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
