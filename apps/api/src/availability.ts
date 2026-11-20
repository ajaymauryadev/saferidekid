import mongoose from 'mongoose';
import { ScheduleBlock, ScheduleLock, SchoolRoute } from './models.js';

export class AvailabilityError extends Error {constructor(public code:string,message:string){super(message);}}
const DAY=86400_000;
export const toIndiaUtc=(date:string,time:string)=>new Date(`${date}T${time}:00+05:30`);
export function eachDate(start:string,end:string){const result:string[]=[];for(let ms=Date.parse(`${start}T00:00:00Z`);ms<=Date.parse(`${end}T00:00:00Z`);ms+=DAY){result.push(new Date(ms).toISOString().slice(0,10));if(result.length>367)throw new AvailabilityError('DATE_RANGE','Choose a schedule within one year.');}return result;}
export function routeRunsOn(route:{startDate:string;endDate:string;weekdays:number[];holidayDates:string[];exceptions:{date?:string|null;active?:boolean|null}[];active:boolean},date:string){if(!route.active||date<route.startDate||date>route.endDate)return false;const exception=route.exceptions.find(e=>e.date===date);if(exception)return !!exception.active;if(route.holidayDates.includes(date))return false;return route.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay());}
export function routeIntervals(route:{morning?:{start:string;end:string}|null;return?:{start:string;end:string}|null},date:string){if(!route.morning||!route.return)throw new AvailabilityError('INVALID_ROUTE_TIMES','Both school sessions need start and end times.');return [route.morning,route.return].map(s=>({start:toIndiaUtc(date,s.start),end:toIndiaUtc(date,s.end)}));}
export function overlaps(aStart:Date,aEnd:Date,bStart:Date,bEnd:Date,bufferMinutes=20){return aStart.getTime()<bEnd.getTime()+bufferMinutes*60000&&aEnd.getTime()+bufferMinutes*60000>bStart.getTime();}
export async function lockSchedule(businessId:mongoose.Types.ObjectId,session:mongoose.ClientSession){await ScheduleLock.updateOne({businessId},{$setOnInsert:{version:0}},{upsert:true});await ScheduleLock.updateOne({businessId},{$inc:{version:1}},{session});}
export async function assertAvailable(args:{businessId:mongoose.Types.ObjectId;vehicleId?:mongoose.Types.ObjectId|null;driverId?:mongoose.Types.ObjectId|null;startAt:Date;endAt:Date;session:mongoose.ClientSession;exceptRouteId?:mongoose.Types.ObjectId;exceptBlockId?:mongoose.Types.ObjectId;bufferMinutes?:number}){
 const {businessId,vehicleId,driverId,startAt,endAt,session}=args;const buffer=args.bufferMinutes??20;
 if(!vehicleId&&!driverId)throw new AvailabilityError('NO_RESOURCE','Choose a vehicle or driver.');
 if(!(startAt<endAt)||endAt.getTime()-startAt.getTime()>14*DAY)throw new AvailabilityError('INVALID_INTERVAL','Choose a real start and end time within fourteen days.');
 const resources=[vehicleId?{vehicleId}:null,driverId?{driverId}:null].filter(Boolean) as ({vehicleId:mongoose.Types.ObjectId}|{driverId:mongoose.Types.ObjectId})[];
 const blocks=await ScheduleBlock.find({businessId,active:true,...(args.exceptBlockId?{_id:{$ne:args.exceptBlockId}}:{}),$or:resources,startAt:{$lt:new Date(endAt.getTime()+120*60000)},endAt:{$gt:new Date(startAt.getTime()-120*60000)}}).session(session).lean();
 const occupied=blocks.find(b=>overlaps(startAt,endAt,b.startAt,b.endAt,Math.max(buffer,b.bufferMinutes)));if(occupied)throw new AvailabilityError('SCHEDULE_CONFLICT',`A ${occupied.type.toLowerCase().replace('_',' ')} occupies this vehicle or driver. Try another eligible resource or a start after ${new Date(occupied.endAt.getTime()+Math.max(buffer,occupied.bufferMinutes)*60000).toISOString()}.`);
 const indiaDate=(d:Date)=>new Date(d.getTime()+5.5*3600_000).toISOString().slice(0,10);
 const from=indiaDate(new Date(startAt.getTime()-DAY)),to=indiaDate(new Date(endAt.getTime()+DAY));
 const routes=await SchoolRoute.find({businessId,active:true,...(args.exceptRouteId?{_id:{$ne:args.exceptRouteId}}:{}),$or:resources,startDate:{$lte:to},endDate:{$gte:from}}).session(session).lean();
 for(const date of eachDate(from,to))for(const route of routes)if(routeRunsOn(route,date))for(const interval of routeIntervals(route,date))if(overlaps(startAt,endAt,interval.start,interval.end,buffer))throw new AvailabilityError('SCHOOL_CONFLICT',`School route ${route.name} occupies this vehicle or driver. Try another eligible resource or a start after ${new Date(interval.end.getTime()+buffer*60000).toISOString()}.`);
}
export async function assertRouteAvailable(route:{businessId:mongoose.Types.ObjectId;vehicleId:mongoose.Types.ObjectId;driverId:mongoose.Types.ObjectId;startDate:string;endDate:string;weekdays:number[];holidayDates:string[];exceptions:{date:string;active:boolean}[];active:boolean;morning:{start:string;end:string};return:{start:string;end:string}},session:mongoose.ClientSession,exceptRouteId?:mongoose.Types.ObjectId){
 if(!route.active)return;
 const intervals=routeIntervals(route,route.startDate);if(intervals.some(i=>!(i.start<i.end))||overlaps(intervals[0].start,intervals[0].end,intervals[1].start,intervals[1].end))throw new AvailabilityError('INVALID_ROUTE_TIMES','Morning and return sessions must be separate real intervals.');
 const resources={$or:[{vehicleId:route.vehicleId},{driverId:route.driverId}]};
 const [routes,blocks]=await Promise.all([
   SchoolRoute.find({businessId:route.businessId,active:true,...(exceptRouteId?{_id:{$ne:exceptRouteId}}:{}),...resources,startDate:{$lte:route.endDate},endDate:{$gte:route.startDate}}).session(session).lean(),
   ScheduleBlock.find({businessId:route.businessId,active:true,...resources,startAt:{$lt:toIndiaUtc(route.endDate,'23:59')},endAt:{$gt:toIndiaUtc(route.startDate,'00:00')}}).session(session).lean()
 ]);
 for(const date of eachDate(route.startDate,route.endDate))if(routeRunsOn(route,date))for(const interval of routeIntervals(route,date)){
   if(blocks.some(b=>overlaps(interval.start,interval.end,b.startAt,b.endAt,Math.max(20,b.bufferMinutes))))throw new AvailabilityError('SCHEDULE_CONFLICT','A booking, maintenance or driver duty already uses this time.');
   if(routes.some(r=>routeRunsOn(r,date)&&routeIntervals(r,date).some(i=>overlaps(interval.start,interval.end,i.start,i.end))))throw new AvailabilityError('SCHOOL_CONFLICT','Another school route uses this vehicle or driver.');
 }
}
