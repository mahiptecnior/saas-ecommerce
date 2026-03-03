const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Capture page errors (unhandled exceptions)
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

    console.log('Navigating to http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'landing_screenshot.png' });

    console.log('Navigating to http://localhost:5173/login ...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'login_screenshot.png' });

    console.log('Navigating to http://localhost:5173/register ...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'register_screenshot.png' });

    await browser.close();
    console.log('Finished.');
})();
