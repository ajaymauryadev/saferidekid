import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const out = resolve('docs/phase01');
await mkdir(out, { recursive: true });
const failures = [];
for (const width of [320, 390, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => failures.push(`${width}: ${e.message}`));
  page.on('console', msg => { if (msg.type() === 'error') failures.push(`${width}: ${msg.text()}`); });
  for (const [name, path] of [['public','/'], ['customer','/app/home'], ['owner','/owner/dashboard'], ['driver','/driver/today']]) {
    await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: resolve(out, `${name}-${width}.png`), fullPage: true });
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth, heading: document.querySelector('h1')?.textContent }));
    if (metrics.scrollWidth > width) failures.push(`${name}-${width}: horizontal overflow ${metrics.scrollWidth}`);
    console.log(name, width, metrics);
  }
  await page.close();
}
await browser.close();
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
