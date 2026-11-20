import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const server = spawn('npm', ['run', 'dev', '-w', '@saferide/web', '--', '--host', '127.0.0.1', '--port', '5187'], { stdio: 'ignore', shell: true });
const base = 'http://127.0.0.1:5187';
const output = new URL('../docs/customer-reference/', import.meta.url);
const now = new Date().toISOString();
const child = (id, name) => ({ id, name, school: 'Green Valley School', className: 'Class 4', subscriptionId: 'sub1', runActive: true, rideStatus: 'BOARDED', confirmedAt: now, driverPhone: '+919100000043', gps: { state: 'STALE', observedAt: now, latitude: null, longitude: null } });
const dashboard = { subscriptions: [{ id: 'sub1', school: 'Green Valley School', status: 'ACTIVE', monthlyFeePaise: 380000 }], children: [child('child1','Aarav'), child('child2','Anaya')], bookings: [{ id: 'booking1', service: 'local', status: 'QUOTED', scheduledAt: now, quotedFarePaise: 125000 }], payments: [{ id: 'payment1', status: 'PENDING_VERIFICATION', amountPaise: 50000, createdAt: now }], notices: [{ id: 'notice1', title: 'Route update', body: 'The operator will confirm any route changes.' , createdAt: now }], ownerPhone: '+919100000099' };
try {
  for (let attempt = 0; attempt < 40; attempt++) { try { if ((await fetch(base)).ok) break; } catch { /* waiting */ } await new Promise(resolve => setTimeout(resolve, 500)); }
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  for (const width of [360,390,768,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 850 }, deviceScaleFactor: 1 });
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user: { id: 'customer1', name: 'Ajay Parent', mobile: '+919100000041', email: null, role: 'CUSTOMER', businessId: 'business1', contactVerified: true, abilities: [] }, csrfToken: 'visual-only' } }));
    await page.route('**/api/customer/dashboard', route => route.fulfill({ json: dashboard }));
    await page.goto(`${base}/app/home`);
    await page.getByText('My child’s ride').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error(`${width}px layout overflows by ${overflow}px`);
    if (width < 900 && await page.locator('.bottom-nav a').count() !== 4) throw new Error('Missing four bottom tabs');
    await page.screenshot({ path: new URL(`customer-${width}.png`, output).pathname.slice(1), fullPage: true });
    await page.getByRole('link', { name: 'Track Vehicle' }).click();
    if (!page.url().includes('/app/school/track?child=child1')) throw new Error('Track action missed selected child');
    await page.goto(`${base}/app/home`);
    await page.getByRole('button', { name: 'Anaya' }).click();
    await page.getByRole('link', { name: 'Mark Leave' }).click();
    if (!page.url().includes('/app/school/leave?child=child2')) throw new Error('Leave action missed selected child');
    await page.close();
  }
  for (const scenario of ['none','pending']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 850 }, deviceScaleFactor: 1 });
    const state = { ...dashboard, children: [], subscriptions: scenario === 'pending' ? [{ id: 'sub2', school: 'River School', status: 'PENDING', monthlyFeePaise: null }] : [] };
    await page.route('**/api/auth/me', route => route.fulfill({ json: { user: { id: 'customer1', name: 'Ajay Parent', mobile: '+919100000041', email: null, role: 'CUSTOMER', businessId: 'business1', contactVerified: true, abilities: [] }, csrfToken: 'visual-only' } }));
    await page.route('**/api/customer/dashboard', route => route.fulfill({ json: state }));
    await page.goto(`${base}/app/home`);
    await page.getByText('Your next journey starts here.').waitFor();
    if (await page.getByText('My child’s ride').count()) throw new Error('Inactive customer saw a child ride card');
    if (scenario === 'pending' && !(await page.getByText('Under review. The operator will confirm the next step.').count())) throw new Error('Missing pending next step');
    await page.screenshot({ path: new URL(`customer-${scenario}-390.png`, output).pathname.slice(1), fullPage: true });
    await page.getByRole('link', { name: /Get school transport/ }).click();
    if (!page.url().includes('/app/school/apply')) throw new Error('School action missed application');
    await page.close();
  }
  await browser.close();
  console.log('Customer screenshots and quick action navigation passed at 360, 390, 768, 1440; none and pending at 390.');
} finally { server.kill(); }
