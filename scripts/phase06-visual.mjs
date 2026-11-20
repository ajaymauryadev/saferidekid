import { chromium } from 'playwright';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Business } from '../apps/api/dist/models.js';
import { User } from '../apps/api/dist/auth-models.js';
import { hashPassword } from '../apps/api/dist/auth.js';
import { GuardianStudentLink, SchoolChild, SchoolSubscription } from '../apps/api/dist/customer-models.js';

const root=process.cwd(),out=resolve(root,'docs/phase06');await mkdir(out,{recursive:true});
const mongo=await MongoMemoryReplSet.create({replSet:{count:1}});let api,web,browser;const failures=[];
async function ready(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error(`Unavailable: ${url}`);}
try{
 await mongoose.connect(mongo.getUri());const business=await Business.create({key:'primary',name:'SafeRide'});const password=await hashPassword('BrowserPhase06Password1!');
 const owner=await User.create({businessId:business._id,role:'OWNER',name:'Visual Owner',mobile:'+919100000701',passwordHash:password,status:'ACTIVE'});
 const parent=await User.create({businessId:business._id,role:'CUSTOMER',name:'Visual Parent',mobile:'+919100000702',passwordHash:password,status:'ACTIVE'});
 const sub=await SchoolSubscription.create({businessId:business._id,customerId:parent._id,school:'Reference School',area:'Central Colony',pickup:'Central main gate',drop:'Central return gate',requestedChildren:2,approvedSlots:2,enrolledCount:1,preferredStartDate:'2026-11-01',contactPhone:parent.mobile,status:'APPROVED',monthlyFeePaise:380000,quoteEffectiveDate:'2026-11-01',routeName:'Central school route'});
 const child=await SchoolChild.create({businessId:business._id,customerId:parent._id,subscriptionId:sub._id,name:'Aarav',school:sub.school,className:'Class 4',pickupStop:'Central main gate',status:'PENDING_REVIEW',childKey:'aarav'});
 await GuardianStudentLink.create({businessId:business._id,childId:child._id,customerId:parent._id,status:'APPROVED',primary:true,proofNote:'Approved subscription',consentAt:new Date(),reviewedAt:new Date(),reviewedBy:owner._id});
 api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:mongo.getUri(),WEB_ORIGIN:'http://127.0.0.1:5176',PORT:'4106'},stdio:'ignore'});
 web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5176'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4106'},stdio:'ignore'});
 await Promise.all([ready('http://127.0.0.1:4106/api/health'),ready('http://127.0.0.1:5176/')]);browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const reference=pathToFileURL(resolve(root,'SafeRide_Complete_Interactive_UI_Simulation.html')).href;
 for(const width of [320,360,390,768,1024,1366,1440])for(const [role,path,mobile] of [['customer','/app/school/children',parent.mobile],['owner','/owner/school/students',owner.mobile]]){
   const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>failures.push(`${role}-${width}: ${e.message}`));
   await page.goto('http://127.0.0.1:5176/login',{waitUntil:'networkidle'});await page.getByLabel('Mobile number or email').fill(mobile);await page.getByLabel('Password',{exact:true}).fill('BrowserPhase06Password1!');await page.getByRole('button',{name:'Log In'}).click();await page.waitForURL(role==='owner'?'**/owner/dashboard':'**/app/home');await page.goto(`http://127.0.0.1:5176${path}`,{waitUntil:'networkidle'});
   await page.getByRole('heading',{name:role==='owner'?'Student directory':'My Children'}).waitFor();await page.screenshot({path:resolve(out,`react-${role}-${width}.png`),fullPage:true});
   const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));if(metrics.scrollWidth>width)failures.push(`${role}-${width} overflow ${metrics.scrollWidth}`);console.log(role,width,metrics);if([390,1440].includes(width)){await page.getByRole('button',{name:role==='owner'?'Add Student':'Add Child'}).click();await page.getByRole('dialog').waitFor();await page.screenshot({path:resolve(out,`react-${role}-modal-${width}.png`),fullPage:true});}
   await page.goto(`${reference}#${path}`,{waitUntil:'load'});await page.screenshot({path:resolve(out,`reference-${role}-${width}.png`),fullPage:true});await page.close();
 }
}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await mongo.stop();}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
