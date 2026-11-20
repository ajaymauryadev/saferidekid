import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 850 } });
    const page = await context.newPage();
    let calls = 0;
    await page.route('**/api/**', async route => { calls++; await new Promise(resolve => setTimeout(resolve, 400)); await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'SERVICE_UNAVAILABLE',message:'Temporarily unavailable'}})}); });
    await page.goto('http://127.0.0.1:4173/urgent');
    await page.getByText('Operator details unavailable').waitFor();
    const metrics = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,hasFallback:!!document.body.textContent?.includes('Operator details unavailable')}));
    if (metrics.scrollWidth > width || !metrics.hasFallback || calls !== 3) throw new Error(`503 fallback failed: ${JSON.stringify({width,calls,...metrics})}`);
    await context.setOffline(true);
    await page.getByText(/offline/i).first().waitFor();
    console.log(JSON.stringify({width,scenario:'400ms throttled 503 plus offline',calls,...metrics}));
    await context.close();
  }
} finally { await browser.close(); }
