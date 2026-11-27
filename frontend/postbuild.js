import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const src = path.join(distDir, 'index.html');
const dest = path.join(distDir, '404.html');

fs.copyFile(src, dest, (err) => {
    if (err) {
        if (err.code === 'ENOENT') {
            console.error('Error: dist/index.html not found. Make sure to build before running this script.');
            process.exit(1);
        }
        throw err;
    }
    console.log('Successfully copied index.html to 404.html for GitHub Pages SPA routing.');
});

const SITE_URL = 'https://geekorium.shop';
const STATIC_ROUTES = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/tournaments', changefreq: 'weekly', priority: '0.8' },
    { loc: '/rankings', changefreq: 'weekly', priority: '0.8' },
    { loc: '/buscamos', changefreq: 'weekly', priority: '0.7' },
    { loc: '/?game=MTG&tab=marketplace', changefreq: 'daily', priority: '0.9' },
    { loc: '/?game=RFB&tab=marketplace', changefreq: 'daily', priority: '0.8' },
    { loc: '/help', changefreq: 'monthly', priority: '0.5' },
    { loc: '/legal', changefreq: 'monthly', priority: '0.3' },
];

const escapeXml = (str) =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

async function generateDynamicSitemap() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
        console.log('Sitemap: VITE_SUPABASE_URL/KEY not set, keeping static sitemap.xml.');
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const seen = new Set();
    const productUrls = [];

    try {
        const pageSize = 1000;
        let offset = 0;
        while (offset < 10000) {
            const url = `${supabaseUrl}/rest/v1/products?select=id,printing_id,finish,updated_at&stock=gt.0&order=updated_at.desc&limit=${pageSize}&offset=${offset}`;
            const res = await fetch(url, {
                headers: {
                    apikey: anonKey,
                    Authorization: `Bearer ${anonKey}`,
                },
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) break;
            const rows = await res.json();
            if (!Array.isArray(rows) || rows.length === 0) break;

            for (const row of rows) {
                const finish = row.finish || 'nonfoil';
                const cardSlug = row.printing_id ? `${row.printing_id}-${finish}` : row.id;
                if (!cardSlug || seen.has(cardSlug)) continue;
                seen.add(cardSlug);
                const lastmod = row.updated_at ? String(row.updated_at).slice(0, 10) : today;
                productUrls.push({
                    loc: `/card/${cardSlug}`,
                    lastmod,
                    changefreq: 'daily',
                    priority: '0.7',
                });
            }

            if (rows.length < pageSize) break;
            offset += pageSize;
        }

        if (productUrls.length === 0) {
            console.log('Sitemap: 0 dynamic product URLs fetched, keeping static sitemap.xml.');
            return;
        }

        const xmlEntries = [
            ...STATIC_ROUTES.map((r) => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${r.loc}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`),
            ...productUrls.map((r) => `  <url>\n    <loc>${escapeXml(`${SITE_URL}${r.loc}`)}</loc>\n    <lastmod>${r.lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`),
        ].join('\n');

        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`;
        fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
        console.log(`Generated dynamic dist/sitemap.xml with ${STATIC_ROUTES.length} static + ${productUrls.length} product URLs.`);
    } catch (err) {
        console.warn('Sitemap dynamic generation skipped (using static sitemap.xml):', err?.message || err);
    }
}

await generateDynamicSitemap();
