import {createServer} from 'node:http';
import {io} from 'socket.io-client';
import {attachTrackingSocket} from './tracking-socket.js';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {createApp} from './app.js';
import {hashPassword} from './auth.js';
import {User} from './auth-models.js';
import {Business,Vehicle,SchoolRoute} from './models.js';
import {SchoolChild,SchoolSubscription,GuardianStudentLink,CustomerBooking} from './customer-models.js';
import {SchoolRun} from './run-models.js';
import {TripLocation} from './tracking.js';

const origin='http://localhost:5173',app=createApp(origin,false);const agents={driver:request.agent(app),other:request.agent(app),parent:request.agent(app),stranger:request.agent(app),guardian:request.agent(app),owner:request.agent(app)};const tokens:Record<string,string>={};let db:MongoMemoryReplSet,runId='',childId='',bookingId='',ownerRunId='',ownerRouteId='';
const send=(name:keyof typeof agents,path:string,body:unknown)=>agents[name].post(path).set('Origin',origin).set('x-csrf-token',tokens[name]).send(body);
beforeAll(async()=>{db=await MongoMemoryReplSet.create({replSet:{count:1}});await mongoose.connect(db.getUri());const business=await Business.create({key:'primary',name:'SafeRide'}),businessId=business._id,password='TrackingPassword1!',hash=await hashPassword(password);const users:Record<string,InstanceType<typeof User>>={};for(const [name,role] of [['driver','DRIVER'],['other','DRIVER'],['parent','CUSTOMER'],['stranger','CUSTOMER'],['guardian','CUSTOMER'],['owner','OWNER']]){users[name]=await User.create({businessId,name,role,mobile:`+91910000800${Object.keys(users).length}`,passwordHash:hash,status:'ACTIVE',abilities:name==='owner'?['DRIVER_DUTY']:[]});const login=await agents[name as keyof typeof agents].post('/api/auth/login').set('Origin',origin).send({identifier:users[name].mobile,password});tokens[name]=login.body.csrfToken;}const vehicle=await Vehicle.create({businessId,name:'School van',type:'PASSENGER_VAN',seats:6});const sub=await SchoolSubscription.create({businessId,customerId:users.parent._id,school:'School',area:'Area',pickup:'Gate',drop:'Gate',requestedChildren:1,preferredStartDate:'2026-11-09',contactPhone:users.parent.mobile,status:'ACTIVE'});const child=await SchoolChild.create({businessId,customerId:users.parent._id,subscriptionId:sub._id,name:'Child',school:'School',status:'ACTIVE'});childId=String(child._id);await GuardianStudentLink.create({businessId,childId:child._id,customerId:users.guardian._id,status:'APPROVED',proofNote:'Owner approved'});const route=await SchoolRoute.create({businessId,name:'School route',school:'School',schoolAddress:'Gate',vehicleId:vehicle._id,driverId:users.driver._id,capacity:6,startDate:'2026-01-01',endDate:'2027-01-01',weekdays:[0,1,2,3,4,5,6],morning:{start:'07:00',end:'08:00'},return:{start:'14:00',end:'15:00'},active:true});const run=await SchoolRun.create({businessId,routeId:route._id,date:'2026-11-09',session:'morning',driverId:users.driver._id,vehicleId:vehicle._id,rosterChildIds:[child._id],status:'ACTIVE',startedAt:new Date(),startedBy:users.driver._id});runId=String(run._id);const ownerRoute=await SchoolRoute.create({businessId,name:'Owner route',school:'School',schoolAddress:'Gate',vehicleId:vehicle._id,driverId:users.owner._id,capacity:6,startDate:'2026-01-01',endDate:'2027-01-01',weekdays:[0,1,2,3,4,5,6],morning:{start:'09:00',end:'10:00'},return:{start:'16:00',end:'17:00'},active:true});ownerRouteId=String(ownerRoute._id);const ownerRun=await SchoolRun.create({businessId,routeId:ownerRoute._id,date:'2026-11-09',session:'morning',driverId:users.owner._id,vehicleId:vehicle._id,rosterChildIds:[child._id],status:'ACTIVE',startedAt:new Date(),startedBy:users.owner._id});ownerRunId=String(ownerRun._id);const booking=await CustomerBooking.create({businessId,customerId:users.parent._id,service:'LOCAL',status:'IN_PROGRESS',startAt:new Date(),actualStartedAt:new Date(),vehicleId:vehicle._id,driverId:users.driver._id});bookingId=String(booking._id);});
afterAll(async()=>{await mongoose.disconnect();await db.stop();});
describe('trip scoped GPS',()=>{it('enforces role, relationship and consent before upload',async()=>{const path=`/api/tracking/run/${runId}?childId=${childId}`;expect((await agents.stranger.get(path)).status).toBe(404);expect((await agents.parent.get(path)).body.state).toBe('NO_LOCATION');expect((await agents.guardian.get(path)).status).toBe(200);expect((await agents.other.get(`/api/tracking/run/${runId}`)).status).toBe(404);expect((await send('other','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true})).status).toBe(404);expect((await send('parent','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true})).status).toBe(403);expect((await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true})).status).toBe(200);});
it('delivers accepted GPS to a signed-in parent through the private trip room',async()=>{
  const server=createServer(app);
  const close=attachTrackingSocket(server,origin);
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  if(!address||typeof address==='string')throw Error('Missing test port');
  const parent=await User.findOne({name:'parent'}).orFail();
  const login=await request(app).post('/api/auth/login').set('Origin',origin).send({identifier:parent.mobile,password:'TrackingPassword1!'});
  const cookie=login.get('Set-Cookie')![0].split(';')[0];
  const socket=io('http://127.0.0.1:'+address.port,{autoConnect:false,transports:['websocket'],extraHeaders:{Origin:origin,Cookie:cookie}});
  const stranger=await User.findOne({name:'stranger'}).orFail();
  const otherLogin=await request(app).post('/api/auth/login').set('Origin',origin).send({identifier:stranger.mobile,password:'TrackingPassword1!'});
  const other=io('http://127.0.0.1:'+address.port,{autoConnect:false,transports:['websocket'],extraHeaders:{Origin:origin,Cookie:otherLogin.get('Set-Cookie')![0].split(';')[0]}});
  const leaks:unknown[]=[];
  other.on('tracking:update',point=>leaks.push(point));
  try{
    await new Promise<void>((resolve,reject)=>{other.once('connect',resolve);other.once('connect_error',reject);other.connect();});
    expect(await other.timeout(3000).emitWithAck('tracking:join',{kind:'run',tripId:runId,childId})).toMatchObject({ok:false});
    await new Promise<void>((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);socket.connect();});
    expect(await socket.timeout(3000).emitWithAck('tracking:join',{kind:'run',tripId:runId,childId:ownerRouteId})).toMatchObject({ok:false});
    expect(await socket.timeout(3000).emitWithAck('tracking:join',{kind:'run',tripId:runId,childId})).toMatchObject({ok:true});
    const update=new Promise(resolve=>socket.once('tracking:update',resolve));
    const observation={kind:'run',tripId:runId,latitude:26.91,longitude:80.91,accuracy:12,observedAt:new Date().toISOString()};
    expect((await send('driver','/api/tracking/point',observation)).status).toBe(200);
    expect(await update).toMatchObject({latitude:26.91,longitude:80.91,state:'FRESH'});
    socket.disconnect();
    await new Promise<void>((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);socket.connect();});
    expect(await socket.timeout(3000).emitWithAck('tracking:join',{kind:'run',tripId:runId,childId})).toMatchObject({ok:true,point:{latitude:26.91}});
    await request(app).post('/api/auth/logout').set('Origin',origin).set('Cookie',cookie).set('x-csrf-token',login.body.csrfToken).expect(204);
    const revoked=new Promise(resolve=>socket.once('tracking:revoked',resolve));
    await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:false});
    await revoked;
    expect(leaks).toHaveLength(0);
    await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true});
    expect((await send('driver','/api/tracking/point',observation)).status).toBe(429);
  }finally{other.disconnect();socket.disconnect();await close();await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true});}
});
it('validates a real observation, throttles uploads and reports stale age',async()=>{const body={kind:'run',tripId:runId,latitude:28.6129,longitude:77.2295,accuracy:19,observedAt:new Date().toISOString()};expect((await send('driver','/api/tracking/point',{...body,latitude:100})).status).toBe(400);expect((await send('driver','/api/tracking/point',{...body,observedAt:new Date(Date.now()-70_000).toISOString()})).status).toBe(400);expect((await send('driver','/api/tracking/point',body)).status).toBe(200);expect((await send('driver','/api/tracking/point',body)).status).toBe(200);expect((await send('driver','/api/tracking/point',{...body,observedAt:new Date(Date.now()+1000).toISOString()})).status).toBe(429);const seen=await agents.parent.get(`/api/tracking/run/${runId}?childId=${childId}`);expect(seen.body).toMatchObject({state:'FRESH',latitude:body.latitude,accuracy:19});expect((await agents.owner.get('/api/tracking/active')).body[0].state).toBe('FRESH');await TripLocation.updateOne({tripId:runId},{$set:{observedAt:new Date(Date.now()-180_000)}});expect((await agents.parent.get(`/api/tracking/run/${runId}?childId=${childId}`)).body.state).toBe('STALE');});
it('permits only an assigned owner with duty to share real GPS',async()=>{const path='/api/tracking/sharing';await User.updateOne({name:'owner'},{$set:{abilities:[]}});expect((await send('owner',path,{kind:'run',tripId:ownerRunId,enabled:true})).status).toBe(403);expect((await send('owner','/api/runs/'+ownerRunId+'/events',{childId,action:'BOARDED',reason:'',idempotencyKey:crypto.randomUUID()})).status).toBe(403);await User.updateOne({name:'owner'},{$set:{abilities:['DRIVER_DUTY']}});expect((await send('owner',path,{kind:'run',tripId:runId,enabled:true})).status).toBe(404);expect((await send('other',path,{kind:'run',tripId:ownerRunId,enabled:true})).status).toBe(404);expect((await send('owner',path,{kind:'run',tripId:ownerRunId,enabled:true})).status).toBe(200);const body={kind:'run',tripId:ownerRunId,latitude:28.6,longitude:77.2,accuracy:18,observedAt:new Date().toISOString()};expect((await send('owner','/api/tracking/point',body)).status).toBe(200);const boarded={childId,action:'BOARDED',reason:'',idempotencyKey:crypto.randomUUID()};expect((await send('owner',`/api/runs/${ownerRunId}/events`,boarded)).status).toBe(200);expect((await send('owner',`/api/runs/${ownerRunId}/events`,boarded)).status).toBe(200);expect((await send('owner',`/api/runs/${ownerRunId}/events`,{...boarded,idempotencyKey:crypto.randomUUID()})).status).toBe(409);expect((await send('owner',`/api/runs/${ownerRunId}/events`,{...boarded,action:'LEAVE_CONFIRMED',reason:'Parent reported leave',idempotencyKey:crypto.randomUUID()})).status).toBe(409);await SchoolRoute.updateOne({_id:ownerRouteId},{$set:{driverId:(await User.findOne({name:'other'}))!._id}});expect((await send('owner','/api/tracking/point',{...body,observedAt:new Date(Date.now()+1000).toISOString()})).status).toBe(404);expect((await send('owner',path,{kind:'run',tripId:ownerRunId,enabled:false})).status).toBe(404);expect((await agents.parent.get('/api/tracking/run/'+ownerRunId+'?childId='+childId)).status).toBe(404);expect((await agents.owner.get('/api/tracking/active')).body.some((x:{tripId:string})=>x.tripId===ownerRunId)).toBe(false);});
it('revokes a suspended driver immediately',async()=>{await User.updateOne({name:'driver'},{$set:{status:'SUSPENDED'}});expect((await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true})).status).toBe(401);expect((await send('driver','/api/tracking/point',{kind:'run',tripId:runId,latitude:28,longitude:77,accuracy:10,observedAt:new Date().toISOString()})).status).toBe(401);await User.updateOne({name:'driver'},{$set:{status:'ACTIVE'}});});
it('stops sharing and immediately revokes completed run access',async()=>{expect((await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:false})).body.state).toBe('DISABLED');expect((await send('driver','/api/tracking/point',{kind:'run',tripId:runId,latitude:28,longitude:77,accuracy:10,observedAt:new Date().toISOString()})).status).toBe(429);await SchoolRun.updateOne({_id:runId},{$set:{status:'COMPLETED'}});expect((await agents.parent.get(`/api/tracking/run/${runId}?childId=${childId}`)).status).toBe(404);expect((await send('driver','/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true})).status).toBe(404);});
it('allows only the booked customer during an active private trip',async()=>{expect((await agents.parent.get(`/api/tracking/booking/${bookingId}`)).status).toBe(200);expect((await agents.stranger.get(`/api/tracking/booking/${bookingId}`)).status).toBe(404);await CustomerBooking.updateOne({_id:bookingId},{$set:{status:'COMPLETED',endAt:new Date()}});expect((await agents.parent.get(`/api/tracking/booking/${bookingId}`)).status).toBe(404);});});






