import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load .env so variables are available during the setup step
dotenv.config();

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Ensure the directory exists
    const dir = path.dirname(authFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    }
    if (!adminEmail || !adminPassword) {
        throw new Error('Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD in .env');
    }

    // Extract project ref from URL (e.g. https://XXXX.supabase.co → XXXX)
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

    const response = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
        },
        data: {
            email: adminEmail,
            password: adminPassword,
        }
    });

    const authData = await response.json();
    if (!authData.access_token) {
        throw new Error(`Authentication failed: ${JSON.stringify(authData)}`);
    }

    await page.goto('/');
    await page.evaluate(({ data, ref }) => {
        const key = `sb-${ref}-auth-token`;
        window.localStorage.setItem(key, JSON.stringify(data));
    }, { data: authData, ref: projectRef });

    await page.context().storageState({ path: authFile });
});
