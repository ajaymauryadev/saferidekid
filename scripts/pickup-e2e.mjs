import { chromium } from 'playwright';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import {createServer,request} from 'node:http';
import express from 'express';
import {resolve} from 'node:path';
import { Business, Vehicle, ScheduleBlock } from '../apps/api/dist/models.js';

import {User} from '../apps/api/dist/auth-models.js';
import {hashPassword} from '../apps/api/dist/auth.js';
import {CustomerBooking} from '../apps/api/dist/customer-models.js';
const root=process.cwd(),origin='http://127.0.0.1:5187';
const split=process.argv.includes('--vercel');
const mongo=await MongoMemoryReplSet.create({replSet:{count:1}});
let api,browser,proxy;
async function ready(url){for(let i=0;i<80;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw Error(`Server unavailable: ${url}`);}
try{
  await mongoose.connect(mongo.getUri());
  const business=await Business.create({key:'primary',name:'SafeRide Kids',phone:'+919876543210'});
  const vehicle=await Vehicle.create({businessId:business._id,name:'Test passenger van',type:'PASSENGER_VAN',seats:6,active:true,legalSuitabilityConfirmed:true,services:['local']});
  const password='BrowserPickupTest1!';
  const customer=await User.create({businessId:business._id,name:'Pickup Tester',role:'CUSTOMER',status:'ACTIVE',mobile:'+919100001010',passwordHash:await hashPassword(password)});
  const port=split?'4187':'5187';
  api=spawn(process.execPath,['apps/api/dist/server.js'],{cwd:root,env:{...process.env,MONGODB_URI:mongo.getUri(),WEB_ORIGIN:origin,PORT:port,NODE_ENV:'test',SERVE_WEB_DIST:String(!split),REVERSE_GEOCODER_URL:'',ORS_API_KEY:''},stdio:'ignore'});
  if(split){
    const edge=express(),dist=resolve(root,'apps/web/dist');
    edge.use('/api',(req,res)=>{
      const url=new URL(req.originalUrl,origin);
      if(url.pathname==='/api/live')url.pathname='/socket.io/';
      const upstream=request({hostname:'127.0.0.1',port,path:url.pathname+url.search,method:req.method,headers:req.headers},response=>{
        res.writeHead(response.statusCode,response.headers);
        response.pipe(res);
      });
      upstream.on('error',()=>res.status(502).end());
      res.on('close',()=>upstream.destroy());
      req.pipe(upstream);
    });
    edge.use(express.static(dist));
    edge.get('/{*path}',(_req,res)=>res.sendFile(resolve(dist,'index.html')));
    proxy=createServer(edge);
    await new Promise(resolve=>proxy.listen(5187,'127.0.0.1',resolve));
  }
  await ready(origin+'/api/ready');
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const width of [320,360,390,768,1440]){
    const context=await browser.newContext({viewport:{width,height:900},permissions:['geolocation'],geolocation:{latitude:26.9,longitude:80.9,accuracy:30}});
    await context.route('https://tile.openstreetmap.org/**',route=>route.abort());
    const page=await context.newPage();
    await page.goto(origin,{waitUntil:'networkidle'});
    const layout=await page.evaluate(()=>{
      const heading=document.querySelector('.premium-hero h1').getBoundingClientRect();
      const header=document.querySelector('.premium-header').getBoundingClientRect();
      return heading.top>=header.bottom&&[...document.querySelectorAll('.quick-book form input,.quick-book form button,.quick-book select')].every(el=>{
        const box=el.getBoundingClientRect();return box.left>=0&&box.right<=innerWidth&&box.height>=44&&el.scrollWidth<=el.clientWidth+1;
      });
    });
    if(!layout)throw Error('Heading or booking control clipped at '+width);
    if(await page.evaluate(()=>document.documentElement.scrollWidth)>width)throw Error(`Horizontal overflow at ${width}px`);
    if(await page.locator('input[autocomplete="street-address"]').inputValue())throw Error('Pickup filled before consent');
    await page.getByRole('button',{name:'मेरी लोकेशन लें',exact:true}).click();
    await page.getByText('पिकअप जगह की पुष्टि करें').waitFor();
    if(await page.locator('input[autocomplete="street-address"]').inputValue())throw Error('Reverse lookup auto-filled pickup');
    await page.locator('input[autocomplete="street-address"]').fill('लालपुर, निघासन, 262903, स्कूल के पास');
    await page.getByRole('button',{name:'यह पिकअप पक्का करें'}).click();
    await page.locator('.quick-book input').nth(1).fill('निघासन बस स्टैंड');
    await page.getByRole('button',{name:'बुकिंग जारी रखें'}).click();
    const draft=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('saferide-public-booking-draft')||'{}'));
    if(!draft.pickup.includes('लालपुर')||!draft.pickupPoint||draft.pickupPoint.accuracy!==30)throw Error(`Confirmed GPS draft missing at ${width}px`);
    if(width===390){
      const dest=page.locator('.booking-location').nth(1);
      await page.locator('#login-id').fill(customer.mobile);
      await page.locator('#login-password').fill(password);
      await page.locator('form button[type=submit]').click();
      await page.waitForURL('**/app/book');
      if(await page.locator('[autocomplete="street-address"]').inputValue()!==draft.pickup)throw Error('Login lost the pickup');
      await dest.getByRole('button',{name:'गंतव्य नक्शे पर चुनें'}).click();
      const map=dest.locator('.leaflet-container');
      if(await map.locator('.leaflet-interactive').count())throw Error('Neutral map opened with a selected pin');
      await map.click({position:{x:100,y:100}});
      await dest.getByRole('button',{name:'यह गंतव्य पक्का करें'}).click();
      await page.reload();
      await dest.getByText('पुष्टि हो गई').waitFor();
      await page.getByRole('button',{name:'आगे'}).click();
      const start=new Date(Date.now()+2*86400000);
      await page.locator('input[type=datetime-local]').first().fill(new Date(start.getTime()-start.getTimezoneOffset()*60000).toISOString().slice(0,16));
      await page.getByRole('button',{name:'आगे'}).click();
      await page.getByText('दूरी उपलब्ध नहीं है — किराया मालिक बताएंगे।').waitFor();
      const submitted=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/api/customer/bookings'));
      await page.getByRole('button',{name:'अनुरोध भेजें'}).click();
      const response=await submitted;if(!response.ok())throw Error('Booking '+response.status()+' '+await response.text());
      await page.waitForURL('**/app/bookings/*');
      const record=await CustomerBooking.findOne({customerId:customer._id}).lean();
      if(record?.destinationPoint?.source!=='MAP'||record?.destinationPoint?.confirmed!==true||record?.pickupPoint?.source!=='GPS'||record?.pickup!==draft.pickup||record.pickupPoint?.timestamp!==draft.pickupPoint.timestamp||record.distanceKm!=null||record.estimatePaise!=null)throw Error('Confirmed booking or owner quote fallback did not persist');
      // Isolated active-trip fixture. Drive the live updates through the assigned driver's HTTP session.
      const driver=await User.create({businessId:business._id,name:'GPS tester',role:'DRIVER',status:'ACTIVE',mobile:'+919100001011',passwordHash:await hashPassword(password)});
      const active=await CustomerBooking.create({businessId:business._id,customerId:customer._id,service:'local',status:'IN_PROGRESS',actualStartedAt:new Date(),driverId:driver._id,vehicleId:vehicle._id});
      const trip={kind:'booking',tripId:String(active._id)};
      await ScheduleBlock.create({businessId:business._id,type:'BOOKING',relatedId:active._id,vehicleId:vehicle._id,driverId:driver._id,startAt:new Date(),endAt:new Date(Date.now()+3600000),reason:'Test duty'});
      const driverContext=await browser.newContext();
      const login=await driverContext.request.post(origin+'/api/auth/login',{headers:{Origin:origin},data:{identifier:driver.mobile,password}});
      const headers={Origin:origin,'x-csrf-token':(await login.json()).csrfToken};
      async function upload(path,data){
        const response=await driverContext.request.post(origin+'/api/tracking/'+path,{headers,data:{...trip,...data}});
        if(!response.ok())throw Error('Tracking '+path+' '+response.status());
      }
      await upload('sharing',{enabled:true});
      await upload('point',{latitude:26.9,longitude:80.9,accuracy:12,observedAt:new Date().toISOString()});
      await page.clock.install();
      await page.goto(origin+'/app/bookings/'+trip.tripId+'/track');
      const marker=page.locator('.track-map .track-vehicle');
      await marker.waitFor();
      const before=await marker.getAttribute('style');
      // Respect the server's minimum interval and require delivery before the 20-second fallback poll.
      await new Promise(resolve=>setTimeout(resolve,10100));
      let polls=0;page.on('request',r=>{if(r.url().includes('/api/tracking/booking/'))polls++;});
      await upload('point',{latitude:26.9005,longitude:80.9005,accuracy:11,observedAt:new Date().toISOString()});
      await page.waitForFunction(previous=>document.querySelector('.track-map .track-vehicle')?.getAttribute('style')!==previous,before,{timeout:4000});
      await page.getByText(/~11 m/).waitFor({timeout:4000});
      if(await marker.count()!==1)throw Error('Duplicate vehicle marker');
      if(polls)throw Error('Marker update depended on an HTTP poll');
      await context.setOffline(true);
      await page.getByText(/ऑफ़लाइन · आखिरी सर्वर जानकारी/).waitFor({timeout:3000});
      await context.setOffline(false);
      await page.clock.setSystemTime(new Date(Date.now()+130000));
      await page.clock.fastForward(10001);
      await page.getByText('पुरानी लोकेशन',{exact:true}).waitFor({timeout:5000});
      if(await marker.count()!==1)throw Error('Last known marker missing while stale');
      await driverContext.close();
    }
    await context.close();
  }
  const race=await browser.newContext({permissions:['geolocation'],geolocation:{latitude:26.9,longitude:80.9,accuracy:15}});
  const racePage=await race.newPage();
  let release;
  const delayed=new Promise(resolve=>{release=resolve;});
  await racePage.route('**/api/public/reverse-location',async route=>{await delayed;await route.fulfill({json:{address:'Wrong city suggestion'}});});
  await racePage.goto(origin);
  const lookup=racePage.waitForRequest('**/api/public/reverse-location');
  await racePage.getByRole('button',{name:'मेरी लोकेशन लें',exact:true}).click();
  await lookup;
  const address=racePage.locator('[autocomplete="street-address"]');
  await address.fill('लालपुर, निघासन स्कूल गेट 262903');
  await racePage.getByRole('button',{name:'यह पिकअप पक्का करें'}).click();
  const arrived=racePage.waitForResponse('**/api/public/reverse-location');
  release();await arrived;
  if(!((await address.inputValue()).includes('निघासन'))||await racePage.getByText(/Wrong city suggestion/).count())throw Error('A delayed lookup superseded the confirmed address');
  await race.close();
  const late=await browser.newPage();
  await late.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:callback=>{window.finishLocation=()=>callback({coords:{latitude:26.8715,longitude:80.8997,accuracy:20},timestamp:Date.now()});}}});});
  await late.goto(origin);
  await late.getByRole('button',{name:'मेरी लोकेशन लें',exact:true}).click();
  await late.locator('input[autocomplete="street-address"]').fill('lalpur nighasan kheri');
  await late.evaluate(()=>window.finishLocation());
  if(await late.locator('.quick-confirm,.leaflet-container').count())throw Error('Delayed GPS attached to an edited address');
  const textDraft=await late.evaluate(()=>JSON.parse(sessionStorage.getItem('saferide-public-booking-draft')));
  if(textDraft.pickup!=='lalpur nighasan kheri'||textDraft.pickupPoint!==null)throw Error('Text-only address changed');
  await late.close();
  const coarse=await browser.newContext({viewport:{width:390,height:844},permissions:['geolocation'],geolocation:{latitude:26.45,longitude:80.33,accuracy:200000}});
  const page=await coarse.newPage();await page.goto(origin,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'मेरी लोकेशन लें',exact:true}).click();
  await page.getByText(/नेटवर्क की अनुमानित जगह/).waitFor();
  if(await page.locator('input[autocomplete="street-address"]').inputValue())throw Error('Coarse Kanpur location filled pickup');
  if(await page.locator('.leaflet-container,.quick-confirm').count())throw Error('Coarse point offered as confirmable GPS');
  await coarse.close();
  const denied=await browser.newContext({viewport:{width:390,height:844}});
  const deniedPage=await denied.newPage();await deniedPage.goto(origin,{waitUntil:'networkidle'});
  await deniedPage.getByRole('button',{name:'मेरी लोकेशन लें',exact:true}).click();
  await deniedPage.getByText(/GPS नहीं मिला या अनुमति नहीं मिली/).waitFor();
  await deniedPage.getByRole('button',{name:'अंग्रेज़ी में बदलें'}).click();
  await deniedPage.getByRole('heading',{name:'Where are you going?'}).waitFor();
  await denied.close();
  console.log('Pickup browser checks passed: GPS, coarse, denied, late suggestion, login, persisted pickup, quotation fallback, live socket marker, Hindi/English and 5 widths. Coordinates are mocked.');
}finally{await browser?.close();proxy?.close();api?.kill();await mongoose.disconnect();await mongo.stop();}
