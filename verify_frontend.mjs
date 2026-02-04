import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('🔍 Navegando a http://localhost:5173/TCG/...');
    await page.goto('http://localhost:5173/TCG/', { waitUntil: 'networkidle0', timeout: 10000 });

    // Esperar 3 segundos para que cargue
    await page.waitForTimeout(3000);

    // Capturar errores de consola
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    // Verificar si hay cartas en el grid
    const cardCount = await page.$$eval('[class*="card"]', cards => cards.length);
    console.log(`📊 Cartas encontradas en el grid: ${cardCount}`);

    // Verificar si hay mensaje de error
    const noCardsMsg = await page.$eval('body', el => el.innerText.includes('No se encontraron cartas'));
    console.log(`❌ Mensaje "No se encontraron cartas": ${noCardsMsg}`);

    // Capturar screenshot
    await page.screenshot({ path: 'verification_screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado en verification_screenshot.png');

    // Mostrar errores de consola
    if (errors.length > 0) {
        console.log('🔴 Errores de consola encontrados:');
        errors.forEach(err => console.log(`  - ${err}`));
    } else {
        console.log('✅ No hay errores de consola');
    }

    await browser.close();
})();
