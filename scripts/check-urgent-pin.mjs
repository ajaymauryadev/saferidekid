import { chromium } from 'playwright';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { Business, UrgentRequest } from '../apps/api/dist/models.js';

const root = process.cwd();
const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri('saferide_test');
let api, web, browser;
async function waitFor(url) { for (let i=0;i<80;i++) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise(r=>setTimeout(r,250)); } throw new Error(`Server did not start: ${url}`); }
try {
  await mongoose.connect(uri);
  await Business.create({ key: 'primary', name: 'SafeRide Development' });
  api = spawn(process.execPath, ['apps/api/dist/server.js'], { cwd: root, env: { ...process.env, MONGODB_URI: uri, WEB_ORIGIN: 'http://127.0.0.1:5175', PORT: '4105', NODE_ENV: 'test' }, stdio: 'ignore' });
  web = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5175'], { cwd: resolve(root, 'apps/web'), env: { ...process.env, API_ORIGIN: 'http://127.0.0.1:4105' }, stdio: 'ignore' });
  await Promise.all([waitFor('http://127.0.0.1:4105/api/ready'), waitFor('http://127.0.0.1:5175/urgent')]);
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 28.6139, longitude: 77.2090, accuracy: 200000 }, permissions: ['geolocation'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/public/reverse-location', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ address: 'Selected map road, New Delhi, India' }) }));
  await page.goto('http://127.0.0.1:5175/urgent', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await page.getByText('Choose the pickup pin').waitFor();
  const map = page.getByLabel('Map for choosing a pickup point');
  await page.locator('.leaflet-container').waitFor();
  await map.click({ position: { x: 90, y: 110 } });
  const selected = await page.getByText(/^Selected point:/).textContent();
  if (!selected || selected.includes('28.61390, 77.20900')) throw new Error('Map click did not move the selected pin.');
  await page.getByPlaceholder('Where should a vehicle come?').waitFor();
  await page.waitForFunction(() => document.querySelector('input[placeholder="Where should a vehicle come?"]')?.value === 'Selected map road, New Delhi, India');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Urgent page overflows at 390 pixels.');
  await page.getByPlaceholder('Mobile number').fill('+12025550104');
  await page.getByRole('button', { name: 'Request urgent transport' }).click();
  await page.getByText('Request received; no guaranteed response.', { exact: true }).waitFor();
  const stored = await UrgentRequest.findOne({ phone: '+12025550104' }).lean();
  if (!stored?.location || Math.abs(stored.location.latitude - 28.6139) < .00001 || stored.location.accuracy !== 200000 || stored.pickup !== 'Selected map road, New Delhi, India') throw new Error('Selected pin, reported accuracy and address were not saved in MongoDB.');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Urgent map pin passed: browser geolocation, pin selection, 390px layout and MongoDB persistence.');
} finally {
  await browser?.close();
  api?.kill(); web?.kill();
  await mongoose.disconnect();
  await mongo.stop();
}
