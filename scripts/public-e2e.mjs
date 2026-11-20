import { chromium } from 'playwright';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Business, Enquiry, Vehicle } from '../apps/api/dist/models.js';

const root = process.cwd();
const output = resolve(root, 'docs/phase02');
await mkdir(output, { recursive: true });
const mongo = await MongoMemoryServer.create();
let api, web, browser;
const failures = [];
async function waitFor(url) { for (let i=0;i<80;i++) { try { const response=await fetch(url); if (response.ok) return; } catch {} await new Promise(r=>setTimeout(r,250)); } throw new Error(`Server did not start: ${url}`); }
try {
  await mongoose.connect(mongo.getUri());
  const business = await Business.create({ key:'primary', name:'SafeRide', phone:'+12025550123', whatsapp:'+12025550123', serviceArea:'Fixture service area', businessHours:'By appointment' });
  await Vehicle.create([
    { businessId:business._id, name:'Passenger van', type:'PASSENGER_VAN', seats:7, services:['school','wedding','party','local'], publicVisible:true, imageUrl:'/assets/saferide-van.webp', registration:'HIDDEN' },
    { businessId:business._id, name:'Goods pickup', type:'GOODS_PICKUP', services:['goods'], publicVisible:true }
  ]);
  api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:mongo.getUri(),WEB_ORIGIN:'http://127.0.0.1:5184',PORT:'4184'},stdio:'ignore'});
  web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5184','--strictPort'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4184'},stdio:'ignore'});
  await Promise.all([waitFor('http://127.0.0.1:4184/api/ready'),waitFor('http://127.0.0.1:5184/')]);
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const reference=pathToFileURL(resolve(root,'SafeRide_Complete_Interactive_UI_Simulation.html')).href;
  for (const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    page.on('pageerror',e=>failures.push(`${width} page error: ${e.message}`));
    page.on('console',msg=>{if(msg.type()==='error')failures.push(`${width} console: ${msg.text()}`);});
    for (const [name,path] of [['home','/'],['services','/services'],['vehicles','/vehicles'],['contact','/contact']]) {
      await page.goto(`http://127.0.0.1:5184${path}`,{waitUntil:'networkidle'});
      await page.screenshot({path:resolve(output,`react-${name}-${width}.png`),fullPage:true});
      const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
      if(scrollWidth>width)failures.push(`${name}-${width} overflow: ${scrollWidth}`);
      if(await page.getByText(/UI Preview|API health|demo portal/i).count())failures.push(`${name}-${width} developer UI visible`);
      if(name==='contact') {
        if(await page.locator('a[href="tel:+12025550123"]').count()!==1)failures.push(`call link missing at ${width}`);
        if(await page.locator('a[href="https://wa.me/12025550123"]').count()!==1)failures.push(`WhatsApp link missing at ${width}`);
      }
      await page.goto(`${reference}#${path}`,{waitUntil:'load'});
      await page.screenshot({path:resolve(output,`reference-${name}-${width}.png`),fullPage:true});
    }
    await page.close();
  }
  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  await mobile.goto('http://127.0.0.1:5184/',{waitUntil:'networkidle'});
  mobile.on('pageerror',e=>failures.push(`mobile page error: ${e.message}`));
  mobile.on('console',msg=>{if(msg.type()==='error')failures.push(`mobile console: ${msg.text()}`);});
  await mobile.getByLabel('Open menu').click();
  await mobile.getByRole('navigation',{name:'Mobile public navigation'}).getByText('Contact').click();
  if(!mobile.url().includes('/contact'))failures.push('mobile drawer did not navigate');
  await mobile.getByRole('button',{name:'Submit enquiry'}).click();
  if(await mobile.getByText('Enter your name.').count()!==1)failures.push('accessible name validation missing');
  await mobile.getByLabel('Your name').fill('Test Customer');
  await mobile.getByLabel('Phone number').fill('+12025550124');
  await mobile.getByLabel('How can we help?').fill('Please advise on an outstation journey next week.');
  await mobile.getByRole('button',{name:'Submit enquiry'}).click();
  await mobile.getByText('Enquiry received').waitFor();
  const saved=await Enquiry.findOne({phone:'+12025550124'}).lean();
  if(!saved || saved.message!=='Please advise on an outstation journey next week.')failures.push('enquiry not persisted');
  await Business.updateOne({_id:business._id},{$set:{phone:null,whatsapp:null}});
  await Vehicle.updateMany({businessId:business._id},{$set:{publicVisible:false}});
  const empty=await browser.newPage({viewport:{width:390,height:844}});
  await empty.goto('http://127.0.0.1:5184/vehicles',{waitUntil:'networkidle'});
  if(await empty.getByText('Vehicles are being added').count()!==1)failures.push('empty fleet state missing');
  await empty.screenshot({path:resolve(output,'react-vehicles-unconfigured-390.png'),fullPage:true});
  await empty.goto('http://127.0.0.1:5184/contact',{waitUntil:'networkidle'});
  if(await empty.locator('a[href^="tel:"]').count())failures.push('fake call link in unconfigured state');
  await empty.screenshot({path:resolve(output,'react-contact-no-phone-390.png'),fullPage:true});
  await empty.close();
  await mobile.close();
  const navigation=await browser.newPage({viewport:{width:1440,height:900}});
  await navigation.goto('http://127.0.0.1:5184/services',{waitUntil:'networkidle'});
  await navigation.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await navigation.getByRole('navigation',{name:'Public navigation'}).getByRole('link',{name:'How It Works'}).click();
  await navigation.getByRole('heading',{name:'Clear steps for every journey.'}).waitFor();
  const headingTop=await navigation.getByRole('heading',{name:'Clear steps for every journey.'}).evaluate(el=>el.getBoundingClientRect().top);
  if(headingTop<0 || headingTop>500)failures.push(`How It Works heading clipped after navigation: top ${headingTop}`);
  await navigation.close();
  for(const width of [320,768]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    for(const path of ['/','/contact']) { await page.goto(`http://127.0.0.1:5184${path}`,{waitUntil:'networkidle'});const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);if(scrollWidth>width)failures.push(`${path} ${width} overflow ${scrollWidth}`); }
    await page.close();
  }
  if(failures.length)throw new Error(failures.join('\n'));
  console.log('Public E2E passed: safe live pages, mobile drawer, tel/WhatsApp links, persisted enquiry, 320/390/768/1440 layouts.');
} finally {
  await browser?.close();
  api?.kill(); web?.kill();
  await mongoose.disconnect();
  await mongo.stop();
}
