import { chromium } from 'playwright';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Business } from '../apps/api/dist/models.js';
import { User } from '../apps/api/dist/auth-models.js';
import { bootstrapOwner } from '../apps/api/dist/owner-bootstrap.js';

const root=process.cwd(), output=resolve(root,'docs/phase03');
await mkdir(output,{recursive:true});
const mongo=await MongoMemoryServer.create();
let api,web,browser;
const failures=[];
async function waitFor(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error(`Server not ready: ${url}`);}
try{
  await mongoose.connect(mongo.getUri());
  await Business.create({key:'primary',name:'SafeRide'});
  await bootstrapOwner({name:'Test Owner',mobile:'+919100000101',password:'OwnerBrowserPassword1!'});
  api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:mongo.getUri(),WEB_ORIGIN:'http://127.0.0.1:5175',PORT:'4101'},stdio:'ignore'});
  web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5175'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4101'},stdio:'ignore'});
  await Promise.all([waitFor('http://127.0.0.1:4101/api/health'),waitFor('http://127.0.0.1:5175/')]);
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const reference=pathToFileURL(resolve(root,'SafeRide_Complete_Interactive_UI_Simulation.html')).href;
  for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    page.on('pageerror',e=>failures.push(`${width}: ${e.message}`));
    await page.goto('http://127.0.0.1:5175/login',{waitUntil:'networkidle'});
    await page.screenshot({path:resolve(output,`react-login-${width}.png`),fullPage:true});
    if((await page.evaluate(()=>document.documentElement.scrollWidth))>width)failures.push(`login overflow ${width}`);
    await page.goto(`${reference}#/login`,{waitUntil:'load'});
    await page.screenshot({path:resolve(output,`reference-login-${width}.png`),fullPage:true});
    await page.close();
  }
  const customer=await browser.newPage({viewport:{width:390,height:844}});
  customer.on('pageerror',e=>failures.push(`customer: ${e.message}`));
  await customer.goto('http://127.0.0.1:5175/signup',{waitUntil:'networkidle'});
  await customer.getByLabel('Full name').fill('Browser Customer');
  await customer.getByLabel('Mobile number with country code').fill('+919100000102');
  await customer.getByLabel('Password',{exact:true}).fill('CustomerBrowserPassword1!');
  await customer.getByLabel(/I agree to the service terms/).check();
  await customer.getByLabel(/I have read the privacy information/).check();
  await customer.getByRole('button',{name:/Create Customer Account/}).click();
  await customer.waitForURL('**/app/home');
  try{await customer.getByText('Hi, Browser 👋').waitFor({timeout:10000});}catch{failures.push('customer home after signup missing');}
  await customer.screenshot({path:resolve(output,'react-customer-after-signup-390.png'),fullPage:true});
  await customer.getByRole('link',{name:'Request a trip'}).click();
  await customer.waitForURL('**/app/book');
  if(!await customer.getByRole('heading',{name:'Plan your journey'}).isVisible())failures.push('trip request did not open booking wizard');
  if((await customer.request.get('http://127.0.0.1:5175/api/auth/me')).status()!==200)failures.push('trip request lost customer session');
  await customer.goto('http://127.0.0.1:5175/app/school',{waitUntil:'networkidle'});
  if(!customer.url().includes('/app/school'))failures.push('school shell denied to customer');
  await customer.goto('http://127.0.0.1:5175/app/bookings',{waitUntil:'networkidle'});
  if(!customer.url().includes('/app/bookings'))failures.push('booking shell denied to same customer');
  await customer.goto('http://127.0.0.1:5175/owner/dashboard',{waitUntil:'networkidle'});
  await customer.waitForURL('**/app/home');
  await customer.getByRole('button',{name:'Log out'}).click();
  await customer.waitForURL('**/login');
  await customer.goto('http://127.0.0.1:5175/app/home',{waitUntil:'networkidle'});
  await customer.waitForURL('**/login');
  await customer.close();
  const owner=await browser.newPage({viewport:{width:1440,height:900}});
  owner.on('pageerror',e=>failures.push(`owner: ${e.message}`));
  await owner.goto('http://127.0.0.1:5175/login',{waitUntil:'networkidle'});
  await owner.getByLabel('Mobile number or email').fill('+919100000101');
  await owner.getByLabel('Password',{exact:true}).fill('OwnerBrowserPassword1!');
  await owner.getByRole('button',{name:'Log In'}).click();
  await owner.waitForURL('**/owner/dashboard');
  await owner.goto('http://127.0.0.1:5175/owner/users',{waitUntil:'networkidle'});
  await owner.getByRole('button',{name:'Invite driver'}).first().click();
  const dialog=owner.getByRole('dialog',{name:'Owner account action'});
  await dialog.getByLabel('Name').fill('Browser Driver');
  await dialog.getByLabel('Mobile').fill('+919100000103');
  await dialog.getByRole('button',{name:'Create invitation'}).click();
  const token=(await dialog.locator('.notice.success code').textContent())?.trim();
  if(!token)failures.push('activation token missing');
  else {
    const driver=await browser.newPage();
    await driver.goto(`http://127.0.0.1:5175/accept-invite?token=${encodeURIComponent(token)}`,{waitUntil:'networkidle'});
    await driver.getByLabel('New password').fill('DriverBrowserPassword1!');
    await driver.getByRole('button',{name:'Activate account'}).click();
    await driver.getByText('Your account is ready. Log in to continue.').waitFor();
    await driver.goto('http://127.0.0.1:5175/login',{waitUntil:'networkidle'});
    await driver.getByLabel('Mobile number or email').fill('+919100000103');
    await driver.getByLabel('Password',{exact:true}).fill('DriverBrowserPassword1!');
    await driver.getByRole('button',{name:'Log In'}).click();
    await driver.waitForURL('**/driver/today');
    await driver.close();
  }
  const savedDriver=await User.findOne({mobile:'+919100000103'});
  if(savedDriver?.status!=='ACTIVE')failures.push('driver activation not persisted');
  await owner.close();
  if(failures.length)throw new Error(failures.join('\n'));
  console.log('Auth browser E2E passed: signup, unified customer routes, role redirect, logout, owner login, driver invitation and activation, 390/1440 login screenshots.');
}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await mongo.stop();}
