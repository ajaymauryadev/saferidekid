import {chromium} from 'playwright';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Business,Enquiry,Vehicle} from '../apps/api/dist/models.js';
import {User} from '../apps/api/dist/auth-models.js';
import {hashPassword} from '../apps/api/dist/auth.js';

const root=process.cwd(),out=resolve(root,'docs/phase07/live');await mkdir(out,{recursive:true});
const mongo=await MongoMemoryServer.create();let api,web,browser;
async function ready(url){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error(`Unavailable: ${url}`);}
try{
 await mongoose.connect(mongo.getUri());
 const business=await Business.create({key:'primary',name:'SafeRide Kids',phone:'+919100010801',whatsapp:'+919100010801',serviceArea:'Test service area'});
 await Vehicle.create({businessId:business._id,name:'Published passenger van',type:'PASSENGER_VAN',services:['school','local'],publicVisible:true,active:true,imageUrl:'/assets/saferide-van.webp',registration:'TEST-ONLY'});
 const password='Phase07BrowserPassword1!';await User.create({businessId:business._id,role:'CUSTOMER',name:'Journey Customer',mobile:'+919100010802',status:'ACTIVE',passwordHash:await hashPassword(password)});
 api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',MONGODB_URI:mongo.getUri(),WEB_ORIGIN:'http://127.0.0.1:5198',PORT:'4198'},stdio:'ignore'});
 web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5198','--strictPort'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4198'},stdio:'ignore'});
 await Promise.all([ready('http://127.0.0.1:4198/api/ready'),ready('http://127.0.0.1:5198/')]);
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5198/',{waitUntil:'networkidle'});
 await page.getByLabel('Pickup village or landmark').fill('Village Central Gate');await page.getByLabel('Destination village or landmark').fill('Market Main Road');await page.getByRole('button',{name:'Continue to booking'}).click();await page.waitForURL('**/login?next=*');
 await page.getByLabel('Mobile number or email').fill('+919100010802');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Log In'}).click();await page.waitForURL('**/app/book');
 if(await page.getByLabel('Pickup village, street or landmark').inputValue()!=='Village Central Gate')throw Error('Pickup draft lost');
 if(await page.getByLabel('Destination city, village or landmark').inputValue()!=='Market Main Road')throw Error('Destination draft lost');
 await page.goto('http://127.0.0.1:5198/');await page.locator('.premium-hero-actions a[href="/app/book"]').click();await page.waitForURL('**/app/book');
 await page.goto('http://127.0.0.1:5198/');await page.locator('.premium-hero-actions a[href="/app/school/apply"]').click();await page.waitForURL('**/app/school/apply');
 await page.goto('http://127.0.0.1:5198/');await page.locator('.vehicle-actions a[href="/vehicles"]').click();await page.waitForURL('**/vehicles');
 await page.goto('http://127.0.0.1:5198/');await page.locator('.premium-service[href="/urgent"]').click();await page.waitForURL('**/urgent');
 await page.goto('http://127.0.0.1:5198/');if(await page.locator('.public-call-icon').getAttribute('href')!=='tel:+919100010801')throw Error('Call CTA did not use the configured number');await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('navigation',{name:'Mobile public navigation'}).getByRole('link',{name:'Services'}).click();await page.waitForURL('**/services');
 await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('navigation',{name:'Mobile public navigation'}).getByRole('link',{name:'Contact'}).click();await page.waitForURL('**/contact');
 await page.goto('http://127.0.0.1:5198/contact',{waitUntil:'networkidle'});if(await page.locator('a[href="tel:+919100010801"]').count()<1)throw Error('Configured phone missing');
 await page.getByLabel('Your name').fill('Test Enquirer');await page.getByLabel('Phone number').fill('+919100010803');await page.getByLabel('Service',{exact:true}).selectOption('local');await page.getByLabel('How can we help?').fill('Please call about a local ride from the village.');await page.getByRole('button',{name:'Submit enquiry'}).click();await page.getByText('Enquiry received').waitFor();if(await Enquiry.countDocuments({businessId:business._id,service:'local'})!==1)throw Error('Enquiry was not saved');
 for(const [route,heading] of [['/services','School days and local journeys'],['/vehicles','A ride that fits your journey'],['/urgent','Need urgent transport']]){await page.goto(`http://127.0.0.1:5198${route}`,{waitUntil:'networkidle'});await page.getByRole('heading',{name:new RegExp(heading)}).waitFor();}
 await page.goto('http://127.0.0.1:5198/');await page.getByRole('button',{name:'Open menu'}).click();await page.keyboard.press('Escape');if(await page.getByRole('button',{name:'Open menu'}).getAttribute('aria-expanded')!=='false')throw Error('Menu did not close on Escape');
 await page.getByRole('button',{name:'Switch to Hindi'}).click();await page.getByText('कहाँ जाना है?').waitFor();await page.screenshot({path:resolve(out,'home-hindi-390.png'),fullPage:true});
 await Business.updateOne({_id:business._id},{$set:{phone:null,whatsapp:null}});await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(250);if(await page.locator('a[href^="tel:+919100010801"]').count())throw Error('Removed phone still shown');
 for(const width of [320,360,390,768,1024,1366,1440]){await page.setViewportSize({width,height:900});for(const route of ['/','/services','/vehicles','/urgent','/contact']){await page.goto(`http://127.0.0.1:5198${route}`,{waitUntil:'networkidle'});const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);if(scroll>width)throw Error(`${route} overflow ${width}/${scroll}`);await page.screenshot({path:resolve(out,`${route==='/'?'home':route.slice(1)}-${width}.png`),fullPage:true});}}
 await page.goto('http://127.0.0.1:5198/',{waitUntil:'networkidle'});await page.context().setOffline(true);await page.getByText('You are offline').waitFor();await page.locator('.quick-book button[type=submit]').waitFor();await page.context().setOffline(false);
 const slow=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await slow.route('**/api/public/**',async route=>{await new Promise(r=>setTimeout(r,1200));await route.continue();});await slow.goto('http://127.0.0.1:5198/',{waitUntil:'domcontentloaded'});await slow.getByRole('link',{name:'Book a ride'}).first().waitFor();await slow.getByText('Illustration · owner vehicle photo needed').waitFor();await slow.close();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Phase 07 live browser: draft, enquiry persistence, contact states, routes, menu, Hindi and five pages at seven widths passed.');
}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await mongo.stop();}
