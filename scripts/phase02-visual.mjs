import {chromium} from 'playwright';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Business,SchoolRoute,Vehicle} from '../apps/api/dist/models.js';
import {User} from '../apps/api/dist/auth-models.js';
import {hashPassword} from '../apps/api/dist/auth.js';
import {SchoolSubscription,SchoolChild,GuardianStudentLink} from '../apps/api/dist/customer-models.js';
import {SchoolRun,RunStudentEvent} from '../apps/api/dist/run-models.js';
import {TripLocation} from '../apps/api/dist/tracking.js';
const root=process.cwd(),out=resolve(root,'tmp/phase02');await mkdir(out,{recursive:true});const db=await MongoMemoryReplSet.create({replSet:{count:1}});let api,web,browser;const failures=[];
async function englishPage(options){
  const page=await browser.newPage(options);
  await page.route('https://tile.openstreetmap.org/**',route=>route.abort());
  await page.addInitScript(()=>localStorage.setItem('saferide-public-language','en'));
  return page;
}
async function ready(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error(`Unavailable: ${url}`);}
try{await mongoose.connect(db.getUri());const business=await Business.create({key:'primary',name:'SafeRide'}),hash=await hashPassword('BrowserPhase08Password1!');const owner=await User.create({businessId:business._id,role:'OWNER',abilities:['DRIVER_DUTY'],name:'Visual Owner',mobile:'+919100008001',passwordHash:hash,status:'ACTIVE'}),driver=await User.create({businessId:business._id,role:'DRIVER',name:'Visual Driver',mobile:'+919100008002',passwordHash:hash,status:'ACTIVE'}),parent=await User.create({businessId:business._id,role:'CUSTOMER',name:'Visual Parent',mobile:'+919100008003',passwordHash:hash,status:'ACTIVE'});const day=new Date(Date.now()+330*60_000).toISOString().slice(0,10);const vehicle=await Vehicle.create({businessId:business._id,name:'School Van',type:'PASSENGER_VAN',seats:4,services:['school'],active:true,legalSuitabilityConfirmed:true});const route=await SchoolRoute.create({businessId:business._id,name:'Central School Route',school:'Green School',schoolAddress:'Main gate',vehicleId:vehicle._id,driverId:driver._id,capacity:4,startDate:day,endDate:day,weekdays:[0,1,2,3,4,5,6],morning:{start:'07:00',end:'08:30'},return:{start:'14:00',end:'15:30'},stops:[{name:'Colony Gate',address:'Colony Gate',order:0}],active:true});const sub=await SchoolSubscription.create({businessId:business._id,customerId:parent._id,school:'Green School',area:'Central',pickup:'Colony Gate',drop:'Colony Gate',requestedChildren:1,approvedSlots:1,preferredStartDate:day,contactPhone:parent.mobile,status:'ACTIVE'});const child=await SchoolChild.create({businessId:business._id,customerId:parent._id,subscriptionId:sub._id,name:'Aarav',school:'Green School',className:'4',pickupStop:'Colony Gate',approvedStop:'Colony Gate',routeId:route._id,effectiveDate:day,assignedDriverId:driver._id,status:'ACTIVE'});await GuardianStudentLink.create({businessId:business._id,childId:child._id,customerId:parent._id,status:'APPROVED',primary:true,proofNote:'Confirmed relationship'});const run=await SchoolRun.create({businessId:business._id,routeId:route._id,date:day,session:'morning',driverId:driver._id,vehicleId:vehicle._id,startedAt:new Date(),startedBy:driver._id});await RunStudentEvent.create({businessId:business._id,runId:run._id,childId:child._id,action:'BOARDED',actorId:driver._id,at:new Date(),idempotencyKey:crypto.randomUUID()});const ownerRoute=await SchoolRoute.create({businessId:business._id,name:'Owner School Route',school:'Green School',schoolAddress:'Main gate',vehicleId:vehicle._id,driverId:owner._id,capacity:4,startDate:day,endDate:day,weekdays:[0,1,2,3,4,5,6],morning:{start:'09:00',end:'10:00'},return:{start:'16:00',end:'17:00'},active:true});const ownerChild=await SchoolChild.create({businessId:business._id,customerId:parent._id,subscriptionId:sub._id,name:'Meera',school:'Green School',className:'3',pickupStop:'Market Gate',approvedStop:'Market Gate',routeId:ownerRoute._id,effectiveDate:day,assignedDriverId:owner._id,status:'ACTIVE'});const ownerRun=await SchoolRun.create({businessId:business._id,routeId:ownerRoute._id,date:day,session:'morning',driverId:owner._id,vehicleId:vehicle._id,rosterChildIds:[ownerChild._id],status:'ACTIVE',startedAt:new Date(),startedBy:owner._id});api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:db.getUri(),WEB_ORIGIN:'http://127.0.0.1:5178',PORT:'4108'},stdio:'ignore'});web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5178'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4108'},stdio:'ignore'});await Promise.all([ready('http://127.0.0.1:4108/api/ready'),ready('http://127.0.0.1:5178/')]);browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});if(!process.argv.includes('--flow-only'))for(const [role,mobile,path,widths,heading] of [['driver',driver.mobile,`/driver/run/${run._id}`,[320,390,1440],'Central School Route'],['owner',owner.mobile,'/owner/school/routes',[1440],'Routes & School Runs'],['owner',owner.mobile,String('/owner/driver/run/')+ownerRun._id,[320,390,1440],'Owner School Route'],['owner',owner.mobile,`/owner/school/run/${run._id}`,[1440],'Central School Route'],['parent',parent.mobile,`/app/school/track?child=${child._id}`,[320,390,1440],'Track Aarav']])for(const width of widths){const page=await englishPage({viewport:{width,height:900}});page.on('pageerror',e=>failures.push(`${role}-${width}: ${e.message}`));await page.goto('http://127.0.0.1:5178/login',{waitUntil:'networkidle'});await page.getByLabel('Mobile number or email').fill(mobile);await page.getByLabel('Password',{exact:true}).fill('BrowserPhase08Password1!');await page.getByRole('button',{name:'Log In'}).click();await page.waitForURL(role==='driver'?'**/driver/today':role==='owner'?'**/owner/dashboard':'**/app/home');await page.goto(`http://127.0.0.1:5178${path}`,{waitUntil:'networkidle'});await page.getByRole('heading',{name:heading}).first().waitFor({timeout:5000});await page.screenshot({path:resolve(out,`${role}-${path.includes('/driver/run/')?'owner-duty':path.includes('/run/')?'run':path.includes('track')?'track':'routes'}-${width}.png`),fullPage:true});const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));if(metrics.scrollWidth>width)failures.push(`${role}-${width} overflow ${metrics.scrollWidth}`);console.log(role,width,metrics);await page.close();}
for(const [actor,mobile,runId,childName,childId] of [['driver',driver.mobile,String(run._id),'Aarav',String(child._id)],['owner',owner.mobile,String(ownerRun._id),'Meera',String(ownerChild._id)]]){
 const page=await englishPage({viewport:{width:390,height:900},permissions:['geolocation'],geolocation:{latitude:28.6129,longitude:77.2295}});
 page.on('pageerror',e=>failures.push(`${actor} GPS: ${e.message}`));
 await page.goto('http://127.0.0.1:5178/login');
 await page.getByLabel('Mobile number or email').fill(mobile);
 await page.getByLabel('Password',{exact:true}).fill('BrowserPhase08Password1!');
 await page.getByRole('button',{name:'Log In'}).click();
 await page.waitForURL(actor==='driver'?'**/driver/today':'**/owner/dashboard');
 await page.goto(`http://127.0.0.1:5178/${actor==='driver'?'driver/run':'owner/driver/run'}/${runId}`);
 await page.getByRole('button',{name:'Start sharing'}).click();
 let point=null;for(let i=0;i<30;i++){point=await TripLocation.findOne({tripId:runId,observedAt:{$ne:null}}).lean();if(point)break;await new Promise(r=>setTimeout(r,500));}
 if(!point)failures.push(`${actor}: browser GPS did not upload`);
 else console.log(actor,'GPS uploaded',point.accuracy);
 await page.context().setOffline(true);
 await page.getByText('Offline. GPS uploads paused until connection returns.').waitFor();
 await page.context().setOffline(false);
 await page.getByText('Connected. Waiting for the next GPS reading.').waitFor();
 if(actor==='owner')await page.getByRole('button',{name:'Boarded',exact:true}).click();
 await page.getByRole('button',{name:'School Reached',exact:true}).click();
 await page.getByText('School Reached confirmed by server').waitFor();
 await page.screenshot({path:resolve(out,`${actor}-confirmed-390.png`),fullPage:true});
 const parentPage=await englishPage({viewport:{width:390,height:900}});
 await parentPage.goto('http://127.0.0.1:5178/login');
 await parentPage.getByLabel('Mobile number or email').fill(parent.mobile);
 await parentPage.getByLabel('Password',{exact:true}).fill('BrowserPhase08Password1!');
 await parentPage.getByRole('button',{name:'Log In'}).click();
 await parentPage.waitForURL('**/app/home');
 await parentPage.goto(`http://127.0.0.1:5178/app/school/track?child=${childId}`);
 await parentPage.getByText('LIVE · recent GPS').waitFor({timeout:10000});
 await parentPage.getByText(childName,{exact:true}).first().waitFor();
 await parentPage.screenshot({path:resolve(out,`${actor}-parent-fresh-390.png`),fullPage:true});
 const marker=parentPage.locator('.track-map .track-vehicle');
 await marker.waitFor();
 const before=await marker.getAttribute('style');
 await new Promise(resolve=>setTimeout(resolve,15100));
 let locationReads=0;
 const countReads=request=>{if(request.url().includes('/api/tracking/run/'))locationReads++;};
 parentPage.on('request',countReads);
 const upload=page.waitForResponse(r=>r.url().endsWith('/api/tracking/point')&&r.request().method()==='POST');
 await page.context().setGeolocation({latitude:28.6135,longitude:77.23,accuracy:14});
 if(!(await upload).ok())throw Error('MOCKED school GPS rejected');
 await parentPage.waitForFunction(previous=>document.querySelector('.track-map .track-vehicle') && document.querySelector('.track-map .track-vehicle').getAttribute('style')!==previous,before,{timeout:3500});
 if(locationReads||await marker.count()!==1)throw Error('School tracking used a poll or duplicate marker');
 const saved=await TripLocation.findOne({tripId:runId}).lean();
 if(saved?.latitude!==28.6135||saved?.accuracy!==14)throw Error('School observation missing from MongoDB');
 parentPage.off('request',countReads);
 const denied=await englishPage({viewport:{width:390,height:900},permissions:[]});
 await denied.goto('http://127.0.0.1:5178/login');
 await denied.getByLabel('Mobile number or email').fill(mobile);
 await denied.getByLabel('Password',{exact:true}).fill('BrowserPhase08Password1!');
 await denied.getByRole('button',{name:'Log In'}).click();
 await denied.waitForURL(actor==='driver'?'**/driver/today':'**/owner/dashboard');
 await denied.goto(`http://127.0.0.1:5178/${actor==='driver'?'driver/run':'owner/driver/run'}/${runId}`);
 await denied.getByRole('button',{name:'Start sharing'}).click();
 await denied.getByText('GPS permission denied. Enable it in browser settings to share.').waitFor();
 await denied.screenshot({path:resolve(out,`${actor}-permission-denied-390.png`),fullPage:true});
 await denied.close();
 await page.getByRole('button',{name:'End Run'}).click();
 await page.getByText('Run completed after all child statuses were confirmed.').waitFor();
 await parentPage.getByText('Run ended',{exact:true}).first().waitFor({timeout:6000});
 if(await marker.count())throw Error('Ended trip retained vehicle marker');
 await parentPage.close();
 await page.goto(`http://127.0.0.1:5178/${actor==='driver'?'driver/today':'owner/driver/today'}`);
 await page.getByRole('button',{name:actor==='driver'?'Start Afternoon run':'Start afternoon'}).click();
 let returnRun=null;for(let i=0;i<20;i++){returnRun=await SchoolRun.findOne({routeId:actor==='driver'?route._id:ownerRoute._id,date:day,session:'afternoon'});if(returnRun)break;await new Promise(r=>setTimeout(r,250));}
 if(!returnRun)throw new Error(`${actor}: return run was not started`);
 await page.goto(`http://127.0.0.1:5178/${actor==='driver'?'driver/run':'owner/driver/run'}/${returnRun._id}`);
 await page.getByRole('button',{name:'Start sharing'}).click();
 let returnPoint=null;for(let i=0;i<30;i++){returnPoint=await TripLocation.findOne({tripId:returnRun._id,observedAt:{$ne:null}}).lean();if(returnPoint)break;await new Promise(r=>setTimeout(r,500));}
 if(!returnPoint)failures.push(`${actor}: return GPS did not upload`);
 await page.getByRole('button',{name:'Return Boarded',exact:true}).click();
 await page.getByRole('button',{name:'Home Dropped',exact:true}).click();
 await page.getByText('Home Dropped confirmed by server').waitFor();
 await page.screenshot({path:resolve(out,`${actor}-return-confirmed-390.png`),fullPage:true});
 await page.getByRole('button',{name:'End Run'}).click();
 await page.getByText('Run completed after all child statuses were confirmed.').waitFor();
 const ended=await englishPage({viewport:{width:390,height:900}});
 await ended.goto('http://127.0.0.1:5178/login');
 await ended.getByLabel('Mobile number or email').fill(parent.mobile);
 await ended.getByLabel('Password',{exact:true}).fill('BrowserPhase08Password1!');
 await ended.getByRole('button',{name:'Log In'}).click();
 await ended.waitForURL('**/app/home');
 await ended.goto(`http://127.0.0.1:5178/app/school/track?child=${childId}`);
 await ended.getByText('Run ended',{exact:true}).first().waitFor();
 if(await ended.locator('.leaflet-interactive').count())failures.push(`${actor}: ended marker remained visible`);
 await ended.screenshot({path:resolve(out,`${actor}-parent-ended-390.png`),fullPage:true});
 await ended.close();
 await page.close();
}}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await db.stop();}if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}











