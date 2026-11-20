import { chromium } from 'playwright';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Business, DriverProfile, Vehicle } from '../apps/api/dist/models.js';
import { User } from '../apps/api/dist/auth-models.js';
import { hashPassword } from '../apps/api/dist/auth.js';
import { SchoolSubscription } from '../apps/api/dist/customer-models.js';

const root=process.cwd(),origin='http://127.0.0.1:5183',apiOrigin='http://127.0.0.1:4183',out=resolve(root,'tmp/phase01-proposal');
let mongo,api,web,browser;
const today=()=>new Date(Date.now()+330*60_000).toISOString().slice(0,10);
async function ready(url){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error(`Not ready: ${url}`);}
async function clickAndCheck(page,width,path,name){await page.setViewportSize({width,height:900});await page.goto(origin+path,{waitUntil:'networkidle'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(overflow>1)throw Error(`${name} at ${width}px has ${overflow}px overflow`);await page.screenshot({path:resolve(out,`${name}-${width}.png`),fullPage:true});}
try{
  await mkdir(out,{recursive:true});
  mongo=await MongoMemoryReplSet.create({replSet:{count:1}});await mongoose.connect(mongo.getUri());
  const business=await Business.create({key:'primary',name:'Phase 01 Isolated Test'});const hash=await hashPassword('FictitiousPass123!');
  const owner=await User.create({businessId:business._id,role:'OWNER',name:'Test Owner',mobile:'+919100091001',passwordHash:hash,status:'ACTIVE'});
  const driver=await User.create({businessId:business._id,role:'DRIVER',name:'Test Driver',mobile:'+919100091002',passwordHash:hash,status:'ACTIVE'});
  await DriverProfile.create({businessId:business._id,userId:driver._id,qualifications:['SCHOOL'],licenseExpiry:null});
  await Vehicle.create({businessId:business._id,name:'Isolated Test Van',registration:'TEST01',type:'PASSENGER_VAN',seats:4,services:['school'],active:true,legalSuitabilityConfirmed:true});
  api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:mongo.getUri(),WEB_ORIGIN:origin,PORT:'4183',NODE_ENV:'test'},stdio:'ignore'});
  web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5183','--strictPort'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:apiOrigin},stdio:'ignore'});
  await Promise.all([ready(apiOrigin+'/api/ready'),ready(origin)]);
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const parentContext=await browser.newContext({viewport:{width:320,height:900}}),ownerContext=await browser.newContext({viewport:{width:360,height:900}});
  for(const context of [parentContext,ownerContext])await context.addInitScript(()=>localStorage.setItem('saferide-public-language','en'));
  const signup=await parentContext.request.post(origin+'/api/auth/signup',{headers:{Origin:origin},data:{name:'Test Parent',mobile:'+919100091003',password:'FictitiousPass123!',acceptTerms:true,acceptPrivacy:true}});if(signup.status()!==201)throw Error(`Signup ${signup.status()}`);
  const login=await ownerContext.request.post(origin+'/api/auth/login',{headers:{Origin:origin},data:{identifier:owner.mobile,password:'FictitiousPass123!'}});if(login.status()!==200)throw Error(`Owner login ${login.status()}`);
  const parent=await parentContext.newPage(),ownerPage=await ownerContext.newPage(),pageErrors=[];for(const page of [parent,ownerPage])page.on('pageerror',error=>pageErrors.push(error.message));
  await clickAndCheck(parent,320,'/app/school/apply','parent-apply');
  if(await parent.getByLabel('Proposed monthly fee per child (₹) *').inputValue()!=='')throw Error('Proposed fee must start blank');
  await parent.getByLabel('School name *').fill('Test Proposal School');await parent.getByLabel('Pickup area *').fill('Test Village');await parent.getByLabel('Pickup stop / address *').fill('Test village main gate');await parent.getByLabel('Return drop point *').fill('Test village main gate');await parent.getByLabel('Service *').selectOption('MORNING');await parent.getByLabel('Proposed monthly fee per child (₹) *').fill('1500');await parent.getByLabel('Preferred start date *').fill(today());await parent.getByLabel('Contact mobile *').fill('+919100091003');await parent.route('**/api/customer/school/subscriptions',route=>route.abort('failed'));await parent.getByRole('button',{name:'Send subscription request'}).click();await parent.getByRole('alert').getByText('Could not complete this action. Please try again.').waitFor();if(await SchoolSubscription.countDocuments())throw Error('Failed network created a request');await parent.unroute('**/api/customer/school/subscriptions');await parent.getByRole('button',{name:'Send subscription request'}).click();await parent.waitForURL('**/app/school');
  let sub=await SchoolSubscription.findOne({businessId:business._id,school:'Test Proposal School'});if(!sub||sub.proposedMonthlyFeePaise!==150000||sub.service!=='MORNING'||sub.status!=='PENDING')throw Error('Customer proposal not persisted');
  await clickAndCheck(ownerPage,360,'/owner/school/subscriptions','owner-review');await ownerPage.getByRole('button',{name:'Review & act'}).first().click();await ownerPage.getByRole('button',{name:/Approve proposed fee/}).click();await ownerPage.getByText('Status updated and customer notice recorded.').waitFor();sub=await SchoolSubscription.findById(sub._id);if(sub?.status!=='ACCEPTED'||sub.monthlyFeePaise!==150000)throw Error('Owner approval not persisted');
  await clickAndCheck(parent,390,'/app/school','parent-approved');
  await clickAndCheck(parent,768,'/app/school/apply','parent-apply');await parent.getByLabel('School name *').fill('Test Counter School');await parent.getByLabel('Pickup area *').fill('Test Village');await parent.getByLabel('Pickup stop / address *').fill('Test village main gate two');await parent.getByLabel('Return drop point *').fill('Test village main gate two');await parent.getByLabel('Proposed monthly fee per child (₹) *').fill('1500');await parent.getByLabel('Preferred start date *').fill(today());await parent.getByLabel('Contact mobile *').fill('+919100091003');await parent.getByRole('button',{name:'Send subscription request'}).click();await parent.waitForURL('**/app/school');
  let counterSub=await SchoolSubscription.findOne({businessId:business._id,school:'Test Counter School'});if(!counterSub)throw Error('Counter request missing');
  await clickAndCheck(ownerPage,1440,'/owner/school/subscriptions','owner-review');await ownerPage.getByRole('button',{name:'Review & act'}).first().click();await ownerPage.getByLabel('Monthly fee per child (₹)').fill('1800');await ownerPage.getByLabel('Reason for this fee').fill('Route price reviewed');await ownerPage.getByRole('button',{name:'Send counteroffer'}).click();await ownerPage.getByText('Status updated and customer notice recorded.').waitFor();counterSub=await SchoolSubscription.findById(counterSub._id);if(counterSub?.status!=='QUOTED'||counterSub.monthlyFeePaise!==180000||counterSub.quoteVersion!==2)throw Error('Counteroffer not persisted');
  await clickAndCheck(parent,390,'/app/school','parent-counter');await parent.getByRole('button',{name:'Accept exact counteroffer'}).click();await parent.getByText('Counteroffer accepted. Waiting for owner authorization.').waitFor();counterSub=await SchoolSubscription.findById(counterSub._id);if(counterSub?.status!=='ACCEPTED'||counterSub.monthlyFeePaise!==180000)throw Error('Customer acceptance not persisted');
  for(const width of [320,360,390,768,1024,1366,1440]){
    await clickAndCheck(parent,width,'/app/school','parent-status');await parent.getByText('View status history').first().click();
    await clickAndCheck(ownerPage,width,'/owner/school/subscriptions','owner-status');await ownerPage.getByRole('button',{name:'Review & act'}).first().click();
    const ownerOverflow=await ownerPage.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ownerOverflow>1)throw Error(`Owner review overflow at ${width}px`);
    await ownerPage.screenshot({path:resolve(out,`owner-actions-${width}.png`),fullPage:true});
  }
  if(pageErrors.length)throw Error(`Browser errors: ${pageErrors.join('; ')}`);
  console.log('PASS Phase 01 authenticated browser and Mongo assertions at 320, 360, 390, 768, 1024, 1366, 1440px');
}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await mongo?.stop();}
