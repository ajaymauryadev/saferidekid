import {chromium} from 'playwright';
const id='64b000000000000000000001';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext();
await context.addInitScript(()=>{
  Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(success){setTimeout(()=>success({coords:{latitude:28.6129,longitude:77.2295,accuracy:20},timestamp:Date.now()}),50);return 1;},clearWatch(){}}});
});
const page=await context.newPage();let fail=true,points=0;
await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/tracking/point'){points++;if(fail)return route.abort('internetdisconnected');}
  let body={};
  if(path==='/api/auth/me')body={user:{id:'64b000000000000000000004',name:'Test Driver',mobile:'+919100000001',email:null,role:'DRIVER',businessId:'64b000000000000000000005',contactVerified:true,abilities:[]},csrfToken:'visual-csrf'};
  else if(path===`/api/runs/${id}`)body={id,routeId:'64b000000000000000000007',routeName:'Central route',school:'School',date:'2026-11-09',session:'morning',status:'ACTIVE',driverId:'64b000000000000000000004',startedAt:new Date().toISOString(),roster:[]};
  else if(path.startsWith('/api/tracking/'))body={kind:'run',tripId:id,vehicleId:'64b000000000000000000003',state:'NO_LOCATION',latitude:null,longitude:null,accuracy:null,observedAt:null,sharing:true};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
await page.goto(`http://127.0.0.1:5173/driver/run/${id}`,{waitUntil:'networkidle'});
await page.getByRole('button',{name:'Start sharing'}).click();
await page.getByRole('status').filter({hasText:'Offline. Location will retry'}).waitFor();
fail=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));
await page.getByRole('status').filter({hasText:'Location sent after reconnecting'}).waitFor();
console.log({points,retried:points===2});
await browser.close();if(points!==2)process.exitCode=1;
