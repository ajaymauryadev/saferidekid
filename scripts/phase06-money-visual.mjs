import {chromium} from 'playwright';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Business} from '../apps/api/dist/models.js';
import {User} from '../apps/api/dist/auth-models.js';
import {SchoolChild,SchoolSubscription} from '../apps/api/dist/customer-models.js';
import {FeeAgreement} from '../apps/api/dist/fee-models.js';
import {StudentAccess} from '../apps/api/dist/student-access-models.js';
import {hashPassword} from '../apps/api/dist/auth.js';
import {reminders} from '../apps/api/dist/fees.js';

const root=process.cwd(),out=resolve(root,'docs/phase06-money');await mkdir(out,{recursive:true});
const mongo=await MongoMemoryServer.create();let api,web,browser;const failures=[];
async function ready(url){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error(`Unavailable: ${url}`);}
try{
 await mongoose.connect(mongo.getUri());const month=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}).slice(0,7);
 const business=await Business.create({key:'primary',name:'SafeRide',phone:'+919100000801',schoolDueDay:28,schoolReminderDays:[7,3,1,0]});
 const password=await hashPassword('BrowserPhase06Money1!');
 const owner=await User.create({businessId:business._id,role:'OWNER',name:'Money Owner',mobile:'+919100000802',passwordHash:password,status:'ACTIVE'});
 const parent=await User.create({businessId:business._id,role:'CUSTOMER',name:'Money Parent',mobile:'+919100000803',passwordHash:password,status:'ACTIVE'});
 const sub=await SchoolSubscription.create({businessId:business._id,customerId:parent._id,school:'Reference School',area:'Central',pickup:'Gate',drop:'Home',requestedChildren:1,approvedSlots:1,enrolledCount:1,preferredStartDate:`${month}-01`,contactPhone:parent.mobile,status:'ACTIVE',acceptedAt:new Date(),monthlyFeePaise:150000});
 const child=await SchoolChild.create({businessId:business._id,customerId:parent._id,subscriptionId:sub._id,name:'Aarav',school:'Reference School',status:'ACTIVE',effectiveDate:`${month}-01`,monthlyFeePaise:150000});
 await FeeAgreement.create({businessId:business._id,customerId:parent._id,childId:child._id,subscriptionId:sub._id,version:1,monthlyFeePaise:150000,effectiveDate:`${month}-01`,dueDay:28,startPolicy:'FULL_MONTH_FROM_START',prorationPolicy:'NONE',status:'ACCEPTED',acceptedAt:new Date(),acceptedBy:parent._id,proposedBy:owner._id,reason:'Approved school fee'});
 const student=await User.create({businessId:business._id,role:'STUDENT',name:'Aarav',mobile:'+919100000804',passwordHash:password,status:'ACTIVE',studentProfileId:child._id});
 await StudentAccess.create({businessId:business._id,childId:child._id,guardianId:parent._id,studentUserId:student._id,mobile:student.mobile,ageYears:14,consentAt:new Date(),consentText:'Guardian consented to restricted student access.',status:'ACTIVE',reviewedBy:owner._id,reviewedAt:new Date()});
 await reminders(business._id,undefined,`${month}-21`);
 api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',MONGODB_URI:mongo.getUri(),WEB_ORIGIN:'http://127.0.0.1:5186',PORT:'4186'},stdio:'ignore'});
 web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5186','--strictPort'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4186'},stdio:'ignore'});
 await Promise.all([ready('http://127.0.0.1:4186/api/ready'),ready('http://127.0.0.1:5186/')]);
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const [role,mobile,path,heading] of [['customer',parent.mobile,'/app/payments','Payments & Receipts'],['owner',owner.mobile,'/owner/finance/fees','Monthly Fees'],['student',student.mobile,'/student/notices','Notices & Updates']]){
  const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>failures.push(`${role}: ${e.message}`));
  await page.goto('http://127.0.0.1:5186/login');await page.getByLabel('Mobile number or email').fill(mobile);await page.getByLabel('Password',{exact:true}).fill('BrowserPhase06Money1!');await page.getByRole('button',{name:'Log In'}).click();await page.waitForURL(role==='owner'?'**/owner/dashboard':role==='student'?'**/student/home':'**/app/home');
  for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});await page.goto(`http://127.0.0.1:5186${path}`,{waitUntil:'networkidle'});await page.getByRole('heading',{name:heading}).first().waitFor();if(role==='student'){const text=await page.locator('main').innerText();if(!text.includes('Please ask your guardian')||text.includes('₹'))failures.push(`student-${width} reminder privacy`);}await page.screenshot({path:resolve(out,`${role}-${width}.png`),fullPage:true});const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);if(scroll>width)failures.push(`${role}-${width} overflow ${scroll}`);console.log(role,width,scroll);}
  await context.close();
 }
 if(failures.length)throw Error(failures.join('\n'));
 console.log('Phase 06 money pages passed at 320, 390 and 1440px for customer, owner and student.');
}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await mongo.stop();}
