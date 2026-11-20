import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {createApp} from './app.js';
import {hashPassword} from './auth.js';
import {User} from './auth-models.js';
import {Business,SchoolRoute,Vehicle} from './models.js';
import {CustomerNotice,SchoolChild,SchoolSubscription} from './customer-models.js';
import {StudentAccess} from './student-access-models.js';
import {RunStudentEvent,SchoolRun} from './run-models.js';

const origin='http://localhost:5173',app=createApp(origin,false);
const owner=request.agent(app),parent=request.agent(app),student=request.agent(app),stranger=request.agent(app);
const password='LongStudentPassword1!';
const today=()=>new Date(Date.now()+330*60_000).toISOString().slice(0,10);
const tomorrow=()=>new Date(Date.now()+330*60_000+86400_000).toISOString().slice(0,10);
let db:MongoMemoryReplSet,ownerCsrf='',parentCsrf='',studentCsrf='',childId='',otherId='',runId='',businessId:mongoose.Types.ObjectId,routeId='';
const post=(agent:ReturnType<typeof request.agent>,path:string,body:unknown,csrf:string)=>agent.post(path).set('Origin',origin).set('x-csrf-token',csrf).send(body);
beforeAll(async()=>{
 db=await MongoMemoryReplSet.create({replSet:{count:1}});await mongoose.connect(db.getUri());
 const business=await Business.create({name:'SafeRide'});businessId=business._id;
 const hash=await hashPassword(password);
 const [o,p,x]=await Promise.all([
  User.create({businessId,name:'Owner',role:'OWNER',mobile:'+919100007101',passwordHash:hash,status:'ACTIVE'}),
  User.create({businessId,name:'Guardian',role:'CUSTOMER',mobile:'+919100007102',passwordHash:hash,status:'ACTIVE'}),
  User.create({businessId,name:'Other',role:'CUSTOMER',mobile:'+919100007103',passwordHash:hash,status:'ACTIVE'})
 ]);
 const vehicle=await Vehicle.create({businessId,name:'Van A',type:'PASSENGER_VAN',seats:8,services:['school'],active:true,legalSuitabilityConfirmed:true});
 const route=await SchoolRoute.create({businessId,name:'Route A',school:'School',schoolAddress:'Gate',vehicleId:vehicle._id,driverId:o._id,capacity:8,startDate:today(),endDate:tomorrow(),weekdays:[0,1,2,3,4,5,6],morning:{start:'08:00',end:'09:00'},return:{start:'14:00',end:'15:30'},stops:[{name:'Gate',address:'Gate',order:0}],active:true});routeId=String(route._id);
 const sub=await SchoolSubscription.create({businessId,customerId:p._id,school:'School',area:'Area',pickup:'Gate',drop:'Gate',requestedChildren:2,approvedSlots:2,preferredStartDate:today(),contactPhone:p.mobile,status:'ACTIVE'});
 const child=await SchoolChild.create({businessId,customerId:p._id,subscriptionId:sub._id,name:'Student A',school:'School',status:'ACTIVE',routeId:route._id,effectiveDate:today(),assignedDriverId:o._id,monthlyFeePaise:50000});childId=String(child._id);
 const other=await SchoolChild.create({businessId,customerId:p._id,subscriptionId:sub._id,name:'Sibling B',school:'School',status:'ACTIVE',routeId:route._id,effectiveDate:today(),assignedDriverId:o._id});otherId=String(other._id);
 const run=await SchoolRun.create({businessId,routeId:route._id,date:today(),session:'morning',driverId:o._id,vehicleId:vehicle._id,rosterChildIds:[child._id,other._id],status:'ACTIVE',startedAt:new Date(),startedBy:o._id});runId=String(run._id);
 ownerCsrf=(await post(owner,'/api/auth/login',{identifier:o.mobile,password},'')).body.csrfToken;
 parentCsrf=(await post(parent,'/api/auth/login',{identifier:p.mobile,password},'')).body.csrfToken;
 await post(stranger,'/api/auth/login',{identifier:x.mobile,password},'');
},30000);
afterAll(async()=>{await mongoose.disconnect();await db.stop();},30000);
describe('restricted student portal',()=>{
 it('requires guardian consent and owner invitation, scopes every read, and revokes sessions',async()=>{
  expect((await post(stranger,`/api/student-access/${childId}/request`,{mobile:'+919100007104',ageYears:15,guardianConsent:true},'')).status).toBe(403);
  expect((await post(parent,`/api/student-access/${childId}/request`,{mobile:'+919100007104',ageYears:12,guardianConsent:true},parentCsrf)).status).toBe(400);
  const requested=await post(parent,`/api/student-access/${childId}/request`,{mobile:'+919100007104',ageYears:15,guardianConsent:true},parentCsrf);
  expect(requested.status).toBe(201);expect(requested.body.status).toBe('PENDING_OWNER');
  const invited=await post(owner,`/api/student-access/${childId}/invite`,{reason:'Guardian consent checked'},ownerCsrf);
  expect(invited.status).toBe(201);expect(invited.body.activationToken).toBeTruthy();
  const accepted=await post(student,'/api/auth/accept-invite',{token:invited.body.activationToken,password,acceptTerms:true,acceptPrivacy:true},'');
  expect(accepted.status).toBe(200);
  const login=await post(student,'/api/auth/login',{identifier:'+919100007104',password},'');expect(login.status).toBe(200);expect(login.body.user.role).toBe('STUDENT');studentCsrf=login.body.csrfToken;
  const home=await student.get('/api/student/home').set('Origin',origin);expect(home.status).toBe(200);expect(home.body.childId).toBe(childId);expect(home.body.name).toBe('Student A');expect(JSON.stringify(home.body)).not.toContain('Sibling B');
  expect((await student.get(`/api/tracking/run/${runId}?childId=${childId}`).set('Origin',origin)).body.state).toBe('NO_LOCATION');
  expect((await student.get(`/api/tracking/run/${runId}?childId=${otherId}`).set('Origin',origin)).status).toBe(404);
  expect((await post(student,'/api/tracking/sharing',{kind:'run',tripId:runId,enabled:true},studentCsrf)).status).toBe(403);
  expect((await student.get(`/api/leaves/day?childId=${otherId}&date=${tomorrow()}`).set('Origin',origin)).status).toBe(404);
  expect((await post(student,'/api/leaves',{childId:otherId,date:tomorrow(),reason:'Try sibling'},studentCsrf)).status).toBe(404);
  expect((await student.get('/api/customer/students').set('Origin',origin)).status).toBe(403);
  const leave=await post(student,'/api/leaves',{childId,date:tomorrow(),reason:'Away'},studentCsrf);expect(leave.status).toBe(201);expect(leave.body.status).toBe('PARENT_CONFIRMATION');
  expect((await post(student,`/api/leaves/${leave.body.id}/confirm`,{},studentCsrf)).status).toBe(403);
  const parentNotifications=await parent.get('/api/notifications').set('Origin',origin);expect(parentNotifications.status).toBe(200);expect(JSON.stringify(parentNotifications.body)).toContain('Student leave needs guardian confirmation');
  const confirmed=await post(parent,`/api/leaves/${leave.body.id}/confirm`,{},parentCsrf);expect(confirmed.status).toBe(200);expect(confirmed.body.status).toBe('CONFIRMED');
  expect((await SchoolChild.findById(childId))?.monthlyFeePaise).toBe(50000);
  const declinedLeave=await post(student,'/api/leaves',{childId,date:today(),reason:'Changed plans'},studentCsrf);expect(declinedLeave.status).toBe(201);
  expect((await post(parent,`/api/leaves/${declinedLeave.body.id}/decline`,{},parentCsrf)).body.status).toBe('REJECTED');
  await RunStudentEvent.create({businessId,runId,childId,action:'BOARDED',actorId:(await User.findOne({businessId,role:'OWNER'}))!._id,at:new Date(),idempotencyKey:crypto.randomUUID()});
  const afterBoarding=await post(student,'/api/leaves',{childId,date:today(),reason:'After boarding'},studentCsrf);
  expect(afterBoarding.status).toBe(409);expect(afterBoarding.body.error.code).toBe('DATE_CONFLICT');
  const studentNotifications=await student.get('/api/notifications').set('Origin',origin);expect(studentNotifications.status).toBe(200);expect(JSON.stringify(studentNotifications.body)).toContain('Leave decision');
  expect((await stranger.get('/api/notifications').set('Origin',origin)).body.total).toBe(0);
  const notice=await post(owner,'/api/owner/communications/notices',{title:'School notice',body:'Tomorrow follow the normal route.',audience:'SCHOOL_ROUTE',routeId,category:'GENERAL'},ownerCsrf);
  expect(notice.status).toBe(201);expect(JSON.stringify((await student.get('/api/notifications').set('Origin',origin)).body)).toContain('School notice');
  const account=await StudentAccess.findOne({businessId,childId});
  await CustomerNotice.create({businessId,studentUserId:account!.studentUserId,title:'School fee reminder',body:'Private balance ₹500.00'});
  const fee=await student.get('/api/fees/student').set('Origin',origin);expect(fee.status).toBe(200);expect(JSON.stringify(fee.body)).not.toContain('₹500');
  const protectedNotices=await student.get('/api/notifications').set('Origin',origin);expect(JSON.stringify(protectedNotices.body)).not.toContain('₹500');
  const revoked=await post(parent,`/api/student-access/${childId}/revoke`,{reason:'Guardian withdrew consent'},parentCsrf);expect(revoked.status).toBe(200);
  expect((await student.get('/api/student/home').set('Origin',origin)).status).toBe(401);
  expect((await post(student,'/api/auth/login',{identifier:'+919100007104',password},'')).status).toBe(401);
  expect(await StudentAccess.countDocuments({businessId,childId,status:'REVOKED'})).toBe(1);
  expect((await post(parent,`/api/student-access/${otherId}/request`,{mobile:'+919100007105',ageYears:16,guardianConsent:true},parentCsrf)).status).toBe(201);
  const unaccepted=await post(owner,`/api/student-access/${otherId}/invite`,{reason:'Guardian consent checked'},ownerCsrf);expect(unaccepted.status).toBe(201);
  expect((await post(parent,`/api/student-access/${otherId}/revoke`,{reason:'Guardian changed their mind'},parentCsrf)).status).toBe(200);
  expect((await post(student,'/api/auth/accept-invite',{token:unaccepted.body.activationToken,password,acceptTerms:true,acceptPrivacy:true},'')).status).toBe(400);
 },30000);
});
