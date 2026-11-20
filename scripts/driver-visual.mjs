import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const out=resolve('docs/phase16');await mkdir(out,{recursive:true});
for(const width of [360,390]){
 const page=await browser.newPage({viewport:{width,height:800},deviceScaleFactor:1});
 await page.route('**/api/auth/me',r=>r.fulfill({json:{user:{id:'driver-test',name:'Driver Test',mobile:'+919100000001',email:null,role:'DRIVER',businessId:'business-test',contactVerified:true,abilities:[]},csrfToken:'test-token'}}));
 await page.route('**/api/driver/today',r=>r.fulfill({json:{date:'2026-11-10',ownerPhone:'+919100000002',items:[{kind:'run',id:'route-test',runId:'run-test',session:'morning',startAt:'2026-11-10T01:30:00.000Z',title:'Central School Route',summary:'Green Valley School',vehicleName:'SafeRide Van',registration:'DL01AB1234',status:'ACTIVE'},{kind:'booking',id:'64a000000000000000000001',runId:null,session:null,startAt:'2026-11-10T10:30:00.000Z',title:'wedding',summary:'Ceremony Hall → City Centre',vehicleName:'SafeRide Van',registration:'DL01AB1234',status:'CONFIRMED'}],unavailable:[]}}));
 await page.route('**/api/driver/schedule/today',r=>r.fulfill({json:{date:'2026-11-10',routes:[],bookings:[],urgents:[],unavailable:[]}}));
 await page.goto('http://127.0.0.1:5173/driver/today',{waitUntil:'networkidle'});
 const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,heading:document.querySelector('h1')?.textContent,actions:[...document.querySelectorAll('.driver-action')].map(x=>Math.round(x.getBoundingClientRect().height))}));
 console.log(width,metrics);
 await page.screenshot({path:resolve(out,`driver-day-${width}.png`),fullPage:true});
 if(metrics.scrollWidth>width||metrics.heading!=='My Day'||metrics.actions.some(x=>x<48))process.exitCode=1;
 await page.route('**/api/driver/trips/64a000000000000000000001',r=>r.fulfill({json:{id:'64a000000000000000000001',service:'wedding',status:'IN_PROGRESS',stage:'STARTED',startAt:'2026-11-10T10:30:00.000Z',actualStartedAt:'2026-11-10T10:31:00.000Z',actualEndedAt:null,pickup:'Ceremony Hall',destination:'City Centre',stops:[],customerName:'Customer',customerPhone:null,vehicleName:'SafeRide Van',registration:'DL01AB1234',startOdometerKm:null,endOdometerKm:null,additionalChargeProposals:[],history:[]}}));
 await page.goto('http://127.0.0.1:5173/driver/trip/64a000000000000000000001',{waitUntil:'networkidle'});
 const trip=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,actions:[...document.querySelectorAll('.driver-action')].map(x=>Math.round(x.getBoundingClientRect().height))}));
 console.log('trip',width,trip);
 await page.screenshot({path:resolve(out,`driver-trip-${width}.png`),fullPage:true});
 if(trip.scrollWidth>width||trip.actions.some(x=>x<48))process.exitCode=1;
 await page.close();
}
await browser.close();
