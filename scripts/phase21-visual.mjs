import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base='http://127.0.0.1:5173';
const out=resolve('docs/phase21');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const widths=[320,360,390,768,1024,1366,1440];
const id='507f1f77bcf86cd799439011';
const user=(role)=>({id,name:role==='OWNER'?'Operator':role==='DRIVER'?'Driver':'Customer',mobile:'+919100000111',email:null,role,businessId:id,contactVerified:true,abilities:[]});
const dashboard={subscriptions:[],children:[],bookings:[],payments:[],notices:[],ownerPhone:null};
const active={...dashboard,subscriptions:[{id,school:'Green Valley School',status:'ACTIVE',monthlyFeePaise:350000}],children:[{id,name:'Aarav',school:'Green Valley School',className:'Class 4',subscriptionId:id,runActive:false,runId:null,rideStatus:null,confirmedAt:null,journey:[],driverPhone:null,gps:{state:'UNAVAILABLE',observedAt:null,latitude:null,longitude:null}}]};
const overview={period:{from:'2026-11-01',to:'2026-11-12'},kpis:Object.fromEntries(['activeStudents','todayRuns','upcomingConfirmedBookings','bookingsNeedingAction','verifiedCollectionsPaise','pendingClaims','pendingClaimsPaise','schoolOutstandingPaise','advancesReceivedPaise','unallocatedVerifiedPaise','activeVehicles','activeTrips','urgentCallbacks'].map(k=>[k,0])),runs:[],upcoming:[],recent:[]};
const cases=[['public','/','PUBLIC'],['login','/login','PUBLIC'],['urgent','/urgent','PUBLIC'],['home-no-school','/app/home','CUSTOMER'],['home-active','/app/home','CUSTOMER','active'],['subscription','/app/school','CUSTOMER'],['children','/app/school/children','CUSTOMER'],['booking','/app/book','CUSTOMER'],['payments','/app/payments','CUSTOMER'],['tracking','/app/school/track','CUSTOMER','active'],['owner-dashboard','/owner/dashboard','OWNER'],['owner-requests','/owner/bookings/requests','OWNER'],['owner-payments','/owner/finance/verify','OWNER'],['owner-fees','/owner/finance/fees','OWNER'],['owner-advances','/owner/finance/advances','OWNER'],['owner-expenses','/owner/finance/expenses','OWNER'],['owner-reports','/owner/reports','OWNER'],['driver-today','/driver/today','DRIVER']];
const rows=[], failures=[];
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
 let role='PUBLIC',scenario='';
 page.on('pageerror',e=>failures.push(`${width} page error: ${e.message}`));
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname;
  let value;
  if(path==='/api/auth/me') value={user:user(role),csrfToken:'visual-only'};
  else if(path==='/api/customer/dashboard') value=scenario==='active'?active:dashboard;
  else if(path==='/api/public/business') value={name:'SafeRide',tagline:null,phone:null,whatsapp:null,serviceArea:null,businessHours:null,logoUrl:null};
  else if(path==='/api/public/services'||path==='/api/public/vehicles') value=[];
  else if(path==='/api/owner/overview/dashboard') value=overview;
  else if(path==='/api/notifications/count') value={unread:0};
  else if(path==='/api/owner/overview/customers') value={items:[],page:1,limit:20,total:0};
  else if(path==='/api/owner/finance/summary') value={revenuePaise:0,collectionPaise:0,refundsPaise:0,expensePaise:0,estimatedProfitPaise:0,schoolOutstandingPaise:0,bookingOutstandingPaise:0};
  else if(path.startsWith('/api/owner/finance/')) value={items:[],total:0,page:1,limit:20};
  else if(path==='/api/owner/payments') value={items:[],counts:{}};
  else if(path==='/api/fees/owner') value={month:'2026-11',items:[]};
  else if(path==='/api/customer/payments/instructions') value={upiId:null,qrUrl:null,cashInstructions:'',bankInstructions:''};
  else if(path==='/api/owner/payments/instructions') value={upiId:null,qrUrl:null,cashInstructions:'',bankInstructions:''};
  else if(path==='/api/fees/customer') value={month:'2026-11',items:[],totals:{billedPaise:0,verifiedPaise:0,pendingPaise:0,duePaise:0,creditPaise:0,previousDuePaise:0}};
  else if(path==='/api/driver/today') value={date:'2026-11-12',ownerPhone:null,items:[],unavailable:[]};
  else if(path==='/api/driver/schedule/today') value={date:'2026-11-12',routes:[],bookings:[],urgents:[],unavailable:[]};
  else if(path==='/api/customer/payments'||path==='/api/customer/payments/statements') value=[];
  else if(path.startsWith('/api/notifications')) value={items:[],page:1,total:0,unread:0};
  else value=[];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
 });
 for(const [name,path,nextRole,nextScenario=''] of cases){
  role=nextRole;scenario=nextScenario;
  await page.goto(base+path,{waitUntil:'networkidle'});
  const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,heading:document.querySelector('main h1,main h2')?.textContent||'',broken:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),buttons:[...document.querySelectorAll('button,a.button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<32}).length}));
  await page.screenshot({path:resolve(out,`${name}-${width}.png`),fullPage:true});
  rows.push({name,width,...metrics});
  if(metrics.width>width+1)failures.push(`${name}-${width}: overflow ${metrics.width}`);
  if(metrics.broken.length)failures.push(`${name}-${width}: broken images ${metrics.broken.join(',')}`);
  if(!metrics.heading)failures.push(`${name}-${width}: no heading`);
 }
 if(width===390){
  role='PUBLIC';await page.goto(base+'/');await page.getByLabel('Open menu').click();
  if(await page.evaluate(()=>document.body.style.overflow)!=='hidden')failures.push('public menu does not lock scrolling');
  await page.keyboard.press('Escape');if(await page.locator('.mobile-menu').getAttribute('open')!==null)failures.push('public menu Escape failed');
  role='OWNER';await page.goto(base+'/owner/dashboard');await page.getByLabel('Open workspace navigation').click();
  if(await page.evaluate(()=>document.body.style.overflow)!=='hidden')failures.push('workspace menu does not lock scrolling');
  await page.keyboard.press('Escape');if(await page.locator('.app-sidebar.open').count())failures.push('workspace menu Escape failed');
  role='CUSTOMER';await page.goto(base+'/app/home');await page.locator('.bottom-nav').getByRole('link',{name:'Bookings'}).click();await page.goBack();if(!page.url().endsWith('/app/home'))failures.push('history navigation failed');
 }
 await page.close();
}
await browser.close();
await writeFile(resolve(out,'results.json'),JSON.stringify({rows,failures},null,2));
console.log(`${rows.length} screenshots; ${failures.length} failures`);if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
