import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Ensure the directory exists
    const dir = path.dirname(authFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const supabaseUrl = 'https://sxuotvogwvmxuvwbsscv.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY';

    const response = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
        },
        data: {
            email: 'test@example.com',
            password: 'testpassword123'
        }
    });

    const authData = await response.json();
    if (!authData.access_token) {
        throw new Error(`Authentication failed: ${JSON.stringify(authData)}`);
    }

    await page.goto('/TCG/');
    await page.evaluate(({ data, projectRef }) => {
        const key = `sb-${projectRef}-auth-token`;
        window.localStorage.setItem(key, JSON.stringify(data));
    }, { data: authData, projectRef: 'sxuotvogwvmxuvwbsscv' });

    await page.context().storageState({ path: authFile });
});
