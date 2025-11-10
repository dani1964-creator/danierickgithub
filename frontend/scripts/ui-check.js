const puppeteer = require('puppeteer');

async function run() {
  const tenantHost = 'danierick.adminimobiliaria.site';
  const base = 'http://localhost:3001/';

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();

  // Ensure Host header is sent so middleware resolves the broker
  await page.setExtraHTTPHeaders({ Host: tenantHost });

  try {
    // Go to root and wait for network + JS to settle
    await page.goto(base, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a little for client-side theme/fav update
    await page.waitForTimeout(1000);

    // Read favicon link and OG image
    const favicon = await page.evaluate(() => {
      const link = document.querySelector('link[rel="icon"]');
      return link ? link.href : null;
    });
    const ogImage = await page.evaluate(() => {
      const m = document.querySelector('meta[property="og:image"]');
      return m ? m.content : null;
    });

    console.log('FAVICON:', favicon);
    console.log('OG_IMAGE:', ogImage);

    // Try to click the first "Ver Detalhes Completos" button
    const [button] = await page.$x("//button[contains(normalize-space(.), 'Ver Detalhes Completos')]");
    let finalUrl = null;
    if (button) {
      // Click and wait for URL to change (SPA navigation)
      const initialUrl = page.url();
      await Promise.all([
        button.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
      ]);
      // give SPA a moment if no navigation event
      await page.waitForTimeout(600);
      finalUrl = page.url();
    } else {
      console.log('No details button found on page');
    }

    console.log('FINAL_URL:', finalUrl);

    await browser.close();
    return { favicon, ogImage, finalUrl };
  } catch (err) {
    console.error('UI check failed:', err);
    await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  run().then(() => process.exit(0));
}
