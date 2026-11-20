import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CustomerBooking, CustomerPayment, GuardianStudentLink } from '../apps/api/dist/customer-models.js';
import { SchoolRun } from '../apps/api/dist/run-models.js';
import { ScheduleBlock } from '../apps/api/dist/models.js';
import { Notification } from '../apps/api/dist/notifications.js';

const mongo = await MongoMemoryServer.create();
try {
  await mongoose.connect(mongo.getUri());
  await Promise.all([CustomerBooking, CustomerPayment, GuardianStudentLink, SchoolRun, ScheduleBlock, Notification].map(model => model.syncIndexes()));
  const businessId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();
  const vehicleId = new mongoose.Types.ObjectId();
  const targetId = new mongoose.Types.ObjectId();
  const at = new Date('2026-11-12T06:00:00Z');
  const rows = Array.from({length:1000},(_,i)=>i);
  await Promise.all([
    CustomerBooking.collection.insertMany(rows.map(i=>({businessId,customerId,status:i%5?'COMPLETED':'REQUESTED',createdAt:new Date(at.getTime()-i*60000)}))),
    CustomerPayment.collection.insertMany(rows.map(i=>({businessId,customerId,status:i%5?'VERIFIED':'PENDING_VERIFICATION',createdAt:new Date(at.getTime()-i*60000),allocations:[{targetId,month:'2026-11'}]}))),
    Notification.collection.insertMany(rows.map(i=>({businessId,recipientId:customerId,readAt:i%2?at:null,createdAt:new Date(at.getTime()-i*60000),sourceKey:`measure:${i}`}))),
    SchoolRun.collection.insertMany(rows.map(i=>({businessId,routeId:new mongoose.Types.ObjectId(),date:'2026-11-12',session:'morning',driverId:customerId,startedAt:new Date(at.getTime()+i*60000)}))),
    ScheduleBlock.collection.insertMany(rows.map(i=>({businessId,active:true,vehicleId,startAt:new Date(at.getTime()+i*60000),endAt:new Date(at.getTime()+i*60000+1800000)}))),
    GuardianStudentLink.collection.insertMany(rows.map(i=>({businessId,customerId,childId:new mongoose.Types.ObjectId(),status:i%2?'APPROVED':'PENDING_GUARDIAN'})))
  ]);
  const cases = [
    ['booking queue',CustomerBooking.collection.find({businessId,status:'REQUESTED'}).sort({createdAt:-1}).limit(20)],
    ['payment target',CustomerPayment.collection.find({businessId,customerId,status:'VERIFIED','allocations.targetId':targetId,'allocations.month':'2026-11'}).limit(20)],
    ['unread count',Notification.collection.find({businessId,recipientId:customerId,readAt:null})],
    ['driver day',SchoolRun.collection.find({businessId,date:'2026-11-12',driverId:customerId}).sort({startedAt:1}).limit(20)],
    ['vehicle conflicts',ScheduleBlock.collection.find({businessId,active:true,vehicleId,startAt:{$lt:new Date(at.getTime()+600000)},endAt:{$gt:at}})],
    ['guardian links',GuardianStudentLink.collection.find({businessId,customerId,status:'APPROVED'})]
  ];
  for (const [name,cursor] of cases) {
    const plan = await cursor.explain('executionStats');
    const index = JSON.stringify(plan.queryPlanner.winningPlan).match(/"indexName":"([^"]+)"/)?.[1] ?? 'none';
    console.log(JSON.stringify({name,index,returned:plan.executionStats.nReturned,keysExamined:plan.executionStats.totalKeysExamined,docsExamined:plan.executionStats.totalDocsExamined,executionMs:plan.executionStats.executionTimeMillis}));
  }
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
