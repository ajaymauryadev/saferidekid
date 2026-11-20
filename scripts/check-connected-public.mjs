import { chromium } from 'playwright';

const origin = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const failures = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', error => failures.push(`${width}: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') failures.push(`${width}: ${message.text()}`); });
    page.on('response', response => { if (response.url().includes('/api/') && response.status() >= 400) failures.push(`${width}: ${response.status()} ${new URL(response.url()).pathname}`); });
    for (const [path, heading] of [
      ['/services', 'Travel plans, one easy platform.'],
      ['/vehicles', 'The right vehicle for your journey.'],
      ['/contact', 'Talk directly to the operator.'],
      ['/urgent', 'Need urgent transport?'],
      ['/how-it-works', 'Clear steps for every journey.'],
    ]) {
      await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: heading }).waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) failures.push(`${width}: ${path} horizontal overflow`);
      if (await page.getByText('Unable to load', { exact: true }).count()) failures.push(`${width}: ${path} load error`);
    }
    await page.close();
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Connected public pages passed at 390 and 1440 pixels; no API or console errors.');
} finally {
  await browser.close();
}
