import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, 'dist', 'index.html');
const dest = path.join(__dirname, 'dist', '404.html');

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
