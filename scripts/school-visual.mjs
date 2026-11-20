import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root=new URL('../',import.meta.url), web=new URL('../apps/web/',import.meta.url), output=new URL('../docs/school-reference/',import.meta.url);
const server=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'--host','127.0.0.1','--port','5188'],{cwd:fileURLToPath(web),stdio:'ignore'});
const base='http://127.0.0.1:5188', now=new Date().toISOString(), today=new Date(Date.now()+5.5*3600_000).toISOString().slice(0,10);
const statuses=['PENDING','QUOTED','ACCEPTED','APPROVED','ACTIVE','PAUSED','REJECTED','CANCELLED'];
const records=statuses.map((status,index)=>({id:`sub${index}`,customerId:'customer1',customerName:'Ajay Parent',customerMobile:'+919100000061',school:['Green Valley School','River View School','Sunrise Academy','Central School'][index%4],area:'Central Colony',pickup:'Central Colony main gate',drop:'Home gate',requestedChildren:2,preferredStartDate:today,contactPhone:'+919100000061',customerNotes:'Morning and return',ownerNotes:'Route and seats checked',status,monthlyFeePaise:status==='PENDING'?null:380000,approvedSlots:status==='PENDING'?0:2,quoteVersion:status==='PENDING'?0:1,quoteExpiresAt:new Date(Date.now()+7*86400_000).toISOString(),quoteEffectiveDate:today,acceptedAt:['ACCEPTED','APPROVED','ACTIVE','PAUSED'].includes(status)?now:null,approvedAt:['APPROVED','ACTIVE','PAUSED'].includes(status)?now:null,vehicleId:['APPROVED','ACTIVE','PAUSED'].includes(status)?'vehicle1':null,driverId:['APPROVED','ACTIVE','PAUSED'].includes(status)?'driver1':null,routeName:['APPROVED','ACTIVE','PAUSED'].includes(status)?'Central route':null,enrolledCount:status==='ACTIVE'?2:status==='APPROVED'?1:0,history:[{action:'CUSTOMER_REQUESTED',at:now,reason:null,quoteVersion:null,monthlyFeePaise:null,approvedSlots:null,effectiveDate:null},{action:status,at:now,reason:'Status confirmed by operator',quoteVersion:1,monthlyFeePaise:380000,approvedSlots:2,effectiveDate:today}],createdAt:now}));
const capacity={vehicles:[{id:'vehicle1',name:'School Van',seats:7,reservedSeats:2,availableSeats:5}],drivers:[{id:'driver1',name:'Driver One'}]};
try {
  for(let attempt=0;attempt<40;attempt++){try{if((await fetch(base)).ok)break;}catch{/* wait */}await new Promise(resolve=>setTimeout(resolve,500));}
  await mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  for(const [role,path,width] of [['customer','/app/school',390],['customer','/app/school',1440],['owner','/owner/school/subscriptions',390],['owner','/owner/school/subscriptions',1440]]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    await page.route('**/api/auth/me',route=>route.fulfill({json:{user:{id:role==='owner'?'owner1':'customer1',name:role==='owner'?'Owner One':'Ajay Parent',mobile:'+919100000061',email:null,role:role.toUpperCase(),businessId:'business1',contactVerified:true,abilities:[]},csrfToken:'visual-only'}}));
    await page.route('**/api/customer/school/subscriptions',route=>route.fulfill({json:records}));
    await page.route('**/api/owner/school/subscriptions',route=>route.fulfill({json:records}));
    await page.route('**/api/owner/school/capacity',route=>route.fulfill({json:capacity}));
    await page.goto(base+path);
    await page.getByText('Green Valley School').first().waitFor();
    for(const status of statuses)if(!await page.getByText(status[0]+status.slice(1).toLowerCase(),{exact:true}).count())throw new Error(`${role} missing ${status}`);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    if(overflow>1)throw new Error(`${role} ${width}px overflow ${overflow}`);
    await page.screenshot({path:fileURLToPath(new URL(`${role}-statuses-${width}.png`,output)),fullPage:true});
    if(role==='owner'&&width===1440){await page.getByRole('button',{name:'Review & act'}).first().click();await page.getByText('Send fee quote').waitFor();await page.screenshot({path:fileURLToPath(new URL('owner-quote-1440.png',output)),fullPage:true});}
    if(role==='customer'&&width===390){await page.getByRole('link',{name:/Request transport/}).click();await page.getByText('01 · School and area').waitFor();await page.screenshot({path:fileURLToPath(new URL('customer-apply-390.png',output)),fullPage:true});}
    await page.close();
  }
  await browser.close();
  console.log('School application and all status layouts passed at 390 and 1440 for customer and owner.');
}finally{server.kill();}
