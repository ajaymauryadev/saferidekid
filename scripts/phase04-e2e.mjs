import { chromium } from 'playwright';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Business, Vehicle } from '../apps/api/dist/models.js';
import { User } from '../apps/api/dist/auth-models.js';
import { hashPassword } from '../apps/api/dist/auth.js';
import { bootstrapOwner } from '../apps/api/dist/owner-bootstrap.js';

const root = process.cwd(), output = resolve(root, 'docs/phase04');
await mkdir(output, { recursive: true });
const mongo = await MongoMemoryServer.create();
const failures = [];
let api, web, browser;
async function waitFor(url) { for (let i = 0; i < 100; i++) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise(r => setTimeout(r, 250)); } throw new Error(`Server unavailable: ${url}`); }
async function check(page, name, width) {
  await page.screenshot({ path: resolve(output, `${name}-${width}.png`), fullPage: true });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (scrollWidth > width) failures.push(`${name} at ${width}px overflows to ${scrollWidth}px`);
}
try {
  await mongoose.connect(mongo.getUri());
  const business = await Business.create({ key: 'primary', name: 'SafeRide', phone: '+919100000901', serviceArea: 'Test service area' });
  await Vehicle.create({ businessId: business._id, name: 'Family van', type: 'PASSENGER_VAN', seats: 7, services: ['school','local','wedding','party','outstation','airport','urgent'], publicVisible: true, active: true, legalSuitabilityConfirmed: true });
  await bootstrapOwner({ name: 'Test Owner', mobile: '+919100000902', password: 'OwnerBrowserPassword1!' });
  await User.create({ businessId: business._id, name: 'Test Customer', mobile: '+919100000903', role: 'CUSTOMER', status: 'ACTIVE', passwordHash: await hashPassword('CustomerBrowserPassword1!'), acceptTerms: true, acceptPrivacy: true });
  api = spawn(process.execPath, ['apps/api/dist/server.js'], { cwd: root, env: { ...process.env, MONGODB_URI: mongo.getUri(), WEB_ORIGIN: 'http://127.0.0.1:5184', PORT: '4184' }, stdio: 'ignore' });
  web = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5184', '--strictPort'], { cwd: resolve(root, 'apps/web'), env: { ...process.env, API_ORIGIN: 'http://127.0.0.1:4184' }, stdio: 'ignore' });
  await Promise.all([waitFor('http://127.0.0.1:4184/api/ready'), waitFor('http://127.0.0.1:5184/')]);
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const guest = await browser.newPage();
  guest.on('pageerror', error => failures.push(`guest: ${error.message}`));
  for (const width of [320, 360, 390, 768, 1440]) {
    await guest.setViewportSize({ width, height: 900 });
    for (const [name, path, heading] of [['vehicles','/vehicles','The right vehicle for your journey.'], ['urgent','/urgent','Need urgent transport?'], ['services','/services','School days, family journeys and planned trips.']]) {
      await guest.goto(`http://127.0.0.1:5184${path}`, { waitUntil: 'networkidle' });
      if (!await guest.getByRole('heading', { name: heading }).isVisible()) failures.push(`${name} missing at ${width}px`);
      await check(guest, name, width);
    }
  }
  await guest.goto('http://127.0.0.1:5184/urgent', { waitUntil: 'networkidle' });
  if (!await guest.getByRole('link', { name: 'Call Owner Now' }).isVisible()) failures.push('configured owner call missing');
  if (await guest.getByRole('link', { name: 'Call Owner Now' }).getAttribute('href') !== 'tel:+919100000901') failures.push('owner call target wrong');
  if ((await guest.locator('.urgent-buttons').evaluate(node => node.compareDocumentPosition(document.querySelector('.urgent-emergency')) & Node.DOCUMENT_POSITION_FOLLOWING)) === 0) failures.push('owner call is not first');
  await guest.setViewportSize({ width: 390, height: 900 });
  await guest.goto('http://127.0.0.1:5184/', { waitUntil: 'networkidle' });
  await guest.getByLabel('Open menu').click();
  await guest.getByRole('navigation', { name: 'Mobile public navigation' }).getByRole('link', { name: 'Vehicles' }).click();
  if (!guest.url().endsWith('/vehicles')) failures.push('mobile public navigation failed');

  const customer = await browser.newPage();
  customer.on('pageerror', error => failures.push(`customer: ${error.message}`));
  await customer.goto('http://127.0.0.1:5184/login', { waitUntil: 'networkidle' });
  await customer.getByLabel('Mobile number or email').fill('+919100000903');
  await customer.getByLabel('Password', { exact: true }).fill('CustomerBrowserPassword1!');
  await customer.getByRole('button', { name: 'Log In' }).click();
  await customer.waitForURL('**/app/home');
  for (const width of [320, 360, 390, 768, 1440]) {
    await customer.setViewportSize({ width, height: 900 });
    await customer.goto('http://127.0.0.1:5184/app/book', { waitUntil: 'networkidle' });
    if (!await customer.getByRole('heading', { name: 'Where are you going?', level: 1 }).isVisible()) failures.push(`booking entry missing at ${width}px`);
    await check(customer, 'booking', width);
    await customer.goto('http://127.0.0.1:5184/app/bookings', { waitUntil: 'networkidle' });
    await check(customer, 'booking-list', width);
  }
  await customer.setViewportSize({ width: 390, height: 900 });
  await customer.getByRole('navigation', { name: 'Customer navigation' }).getByRole('link', { name: 'Payments' }).click();
  if (!customer.url().endsWith('/app/payments')) failures.push('mobile customer navigation failed');
  await customer.setViewportSize({ width: 390, height: 900 });
  await customer.goto('http://127.0.0.1:5184/app/book', { waitUntil: 'networkidle' });
  await customer.getByLabel('Pickup village, street or landmark').fill('Main village square');
  await customer.getByLabel('Destination').fill('Town railway station');
  await customer.getByRole('button', { name: 'Continue' }).click();
  await customer.getByRole('button', { name: 'Continue' }).click();
  const start = new Date(Date.now() + 3 * 86400000), end = new Date(start.getTime() + 3 * 3600000);
  const local = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  await customer.getByLabel('Start date and time').fill(local(start));
  await customer.getByLabel('End date and time').fill(local(end));
  await customer.getByRole('button', { name: 'Continue' }).click();
  if (!await customer.getByText('Distance unavailable — owner will confirm the fare.').isVisible()) failures.push('honest fare state missing');
  await customer.getByRole('button', { name: 'Send booking request' }).click();
  await customer.waitForURL(/\/app\/bookings\/[a-f0-9]{24}$/);
  const bookingId = customer.url().split('/').at(-1);

  const owner = await browser.newPage();
  owner.on('pageerror', error => failures.push(`owner: ${error.message}`));
  await owner.goto('http://127.0.0.1:5184/login', { waitUntil: 'networkidle' });
  await owner.getByLabel('Mobile number or email').fill('+919100000902');
  await owner.getByLabel('Password', { exact: true }).fill('OwnerBrowserPassword1!');
  await owner.getByRole('button', { name: 'Log In' }).click();
  await owner.waitForURL('**/owner/dashboard');
  for (const width of [320, 360, 390, 768, 1440]) {
    await owner.setViewportSize({ width, height: 900 });
    await owner.goto('http://127.0.0.1:5184/owner/bookings/requests', { waitUntil: 'networkidle' });
    if (!await owner.getByText('Main village square → Town railway station').isVisible()) failures.push(`owner queue missing request at ${width}px`);
    await check(owner, 'owner-requests', width);
  }
  await owner.goto(`http://127.0.0.1:5184/owner/bookings/${bookingId}`, { waitUntil: 'networkidle' });
  if (!await owner.getByRole('heading', { name: /Local/ }).isVisible()) failures.push('owner booking detail missing');
  await owner.getByLabel('Fare ₹').fill('1250');
  await owner.getByLabel('Advance ₹').fill('250');
  await owner.getByLabel('Valid until').fill(local(new Date(Date.now() + 86400000)));
  await owner.getByRole('button', { name: 'Send versioned quote' }).click();
  await owner.getByRole('heading', { name: 'Quotes and advance' }).waitFor();
  await customer.goto(`http://127.0.0.1:5184/app/bookings/${bookingId}`, { waitUntil: 'networkidle' });
  await customer.getByRole('button', { name: 'Accept current quote' }).click();
  await customer.getByText('Awaiting verified advance').waitFor();
  await customer.goto('http://127.0.0.1:5184/app/payments', { waitUntil: 'networkidle' });
  await customer.getByRole('button', { name: 'Trip Payments' }).click();
  if (!await customer.getByText('local · Main village square → Town railway station').isVisible()) failures.push('booking payment option missing');
  await check(customer, 'trip-payments', 390);
  await Business.updateOne({ _id: business._id }, { $set: { phone: null } });
  const fallback = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await fallback.goto('http://127.0.0.1:5184/urgent', { waitUntil: 'networkidle' });
  if (!await fallback.getByText('Owner number is not configured. Use the callback form or contact page.').isVisible()) failures.push('unconfigured owner number fallback missing');
  await check(fallback, 'urgent-no-phone', 390);
  await fallback.close();
  await guest.close(); await customer.close(); await owner.close();
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Phase 04 DB-backed Playwright passed: public fleet, urgent call, services, customer booking request, owner queue, 320/360/390/768/1440px.');
} finally { await browser?.close(); api?.kill(); web?.kill(); await mongoose.disconnect(); await mongo.stop(); }
