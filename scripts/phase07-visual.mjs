import { chromium } from 'playwright';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Business, DriverProfile, SchoolRoute, Vehicle } from '../apps/api/dist/models.js';
import { User } from '../apps/api/dist/auth-models.js';
import { hashPassword } from '../apps/api/dist/auth.js';

const root=process.cwd(),out=resolve(root,'docs/phase07');await mkdir(out,{recursive:true});
const mongo=await MongoMemoryReplSet.create({replSet:{count:1}});let api,web,browser;const failures=[];
async function ready(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error(`Unavailable: ${url}`);}
try{
 await mongoose.connect(mongo.getUri());const business=await Business.create({key:'primary',name:'SafeRide'}),hash=await hashPassword('BrowserPhase07Password1!');
 const owner=await User.create({businessId:business._id,role:'OWNER',name:'Visual Owner',mobile:'+919100000901',passwordHash:hash,status:'ACTIVE'});
 const driver=await User.create({businessId:business._id,role:'DRIVER',name:'Visual Driver',mobile:'+919100000902',passwordHash:hash,status:'ACTIVE'});
 await DriverProfile.create({businessId:business._id,userId:driver._id,qualifications:['SCHOOL','PASSENGER'],notes:'School qualified'});
 const vehicle=await Vehicle.create({businessId:business._id,name:'School Van',type:'PASSENGER_VAN',registration:'UP32AB1234',seats:7,services:['school','local'],active:true,legalSuitabilityConfirmed:true,driverId:driver._id});
 const date=new Date(Date.now()+5.5*3600_000).toISOString().slice(0,10);
 await SchoolRoute.create({businessId:business._id,name:'Central School Route',school:'Reference School',schoolAddress:'School main gate',vehicleId:vehicle._id,driverId:driver._id,capacity:7,startDate:date,endDate:date,weekdays:[0,1,2,3,4,5,6],holidayDates:[],exceptions:[],morning:{start:'07:00',end:'08:30'},return:{start:'14:00',end:'15:30'},stops:[{name:'Colony Gate',address:'Central colony gate',order:0}],active:true});
 api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:mongo.getUri(),WEB_ORIGIN:'http://127.0.0.1:5177',PORT:'4107'},stdio:'ignore'});
 web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5177'],{cwd:resolve(root,'apps/web'),env:{...process.env,API_ORIGIN:'http://127.0.0.1:4107'},stdio:'ignore'});
 await Promise.all([ready('http://127.0.0.1:4107/api/health'),ready('http://127.0.0.1:5177/')]);browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const reference=pathToFileURL(resolve(root,'SafeRide_Complete_Interactive_UI_Simulation.html')).href;
 for(const width of [320,360,390,768,1024,1366,1440])for(const [role,path,mobile,heading] of [['fleet','/owner/fleet',owner.mobile,'Vehicles & Drivers'],['routes','/owner/school/routes',owner.mobile,'Routes & School Runs'],['calendar','/owner/calendar',owner.mobile,'Transport Calendar'],['driver','/driver/today',driver.mobile,"Today's schedule"]]){
   const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>failures.push(`${role}-${width}: ${e.message}`));
   await page.goto('http://127.0.0.1:5177/login',{waitUntil:'networkidle'});await page.getByLabel('Mobile number or email').fill(mobile);await page.getByLabel('Password',{exact:true}).fill('BrowserPhase07Password1!');await page.getByRole('button',{name:'Log In'}).click();await page.waitForURL(role==='driver'?'**/driver/today':'**/owner/dashboard');await page.goto(`http://127.0.0.1:5177${path}`,{waitUntil:'networkidle'});
   await page.getByRole('heading',{name:heading}).first().waitFor();await page.screenshot({path:resolve(out,`react-${role}-${width}.png`),fullPage:true});
   const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));if(metrics.scrollWidth>width)failures.push(`${role}-${width} overflow ${metrics.scrollWidth}`);console.log(role,width,metrics);
   if([390,1440].includes(width)&&role==='fleet'){await page.getByRole('button',{name:'Add Vehicle'}).click();await page.getByRole('heading',{name:'Add vehicle'}).waitFor();await page.screenshot({path:resolve(out,`react-fleet-form-${width}.png`),fullPage:true});}
   if([390,1440].includes(width)&&role==='routes'){await page.getByRole('button',{name:'Add Route'}).click();await page.getByRole('heading',{name:'Add school route'}).waitFor();await page.screenshot({path:resolve(out,`react-route-form-${width}.png`),fullPage:true});}
   await page.goto(`${reference}#${path}`,{waitUntil:'load'});await page.screenshot({path:resolve(out,`reference-${role}-${width}.png`),fullPage:true});await page.close();
 }
}finally{await browser?.close();api?.kill();web?.kill();await mongoose.disconnect();await mongo.stop();}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
