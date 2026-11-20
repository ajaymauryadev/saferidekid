import {StudentAccess} from './student-access-models.js';
import { Router } from 'express';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { requireAuth, requireCsrf, requireOrigin, requireRole } from './auth.js';
import { AuditEvent, User } from './auth-models.js';
import { CustomerBooking, CustomerNotice, CustomerPayment, GuardianStudentLink, SchoolChild, SchoolSubscription } from './customer-models.js';
import { Enquiry, SchoolRoute, UrgentRequest } from './models.js';
import { SchoolRun } from './run-models.js';

const NotificationSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, required: true }, recipientId: { type: Schema.Types.ObjectId, required: true },
  kind: { type: String, required: true }, title: { type: String, required: true }, body: { type: String, required: true },
  sourceKey: { type: String, required: true }, deliveredAt: { type: Date, default: Date.now }, seenAt: { type: Date, default: null }, readAt: { type: Date, default: null }
}, { timestamps: true });
NotificationSchema.index({ businessId: 1, recipientId: 1, createdAt: -1 });
NotificationSchema.index({ businessId: 1, recipientId: 1, readAt: 1 });
NotificationSchema.index({ businessId: 1, recipientId: 1, sourceKey: 1 }, { unique: true });
export const Notification = mongoose.model('Notification', NotificationSchema);

export async function deliver(businessId: mongoose.Types.ObjectId, recipients: mongoose.Types.ObjectId[], kind: string, title: string, body: string, sourceKey: string, session?: mongoose.ClientSession | null) {
  const ids = [...new Set(recipients.map(String))];
  if (!ids.length) return 0;
  const allowed = await User.find({ _id: { $in: ids }, businessId, status: 'ACTIVE' }).select('_id').session(session??null).lean();
  if (!allowed.length) return 0;
  const operations = allowed.map(user => ({ updateOne: { filter: { businessId, recipientId: user._id, sourceKey }, update: { $setOnInsert: { businessId, recipientId: user._id, kind, title, body, sourceKey, deliveredAt: new Date() } }, upsert: true } }));
  const result = await Notification.bulkWrite(operations, { ordered: false, ...(session?{session}:{}) });
  return result.upsertedCount;
}
async function ownerIds(businessId: mongoose.Types.ObjectId, session?:mongoose.ClientSession|null) { return (await User.find({ businessId, role: 'OWNER', status: 'ACTIVE' }).select('_id').session(session??null).lean()).map(u => u._id); }
export async function notificationFromAudit(a: InstanceType<typeof AuditEvent>) {
  const businessId = a.businessId as mongoose.Types.ObjectId;
  const action = a.action;
  const session=a.$session();
  const owner = async (title: string) => deliver(businessId, await ownerIds(businessId,session), action, title, 'Open the relevant workspace queue to review this update.', `audit:${a._id}`,session);
  const customer = async (customerId: mongoose.Types.ObjectId, title: string) => deliver(businessId, [customerId], action, title, 'Open your account for the latest confirmed details.', `audit:${a._id}`,session);
  if (action === 'SCHOOL_REQUESTED' || action === 'SCHOOL_QUOTE_ACCEPTED') { await owner(action === 'SCHOOL_REQUESTED' ? 'School enrollment request received' : 'School quote accepted'); if(action==='SCHOOL_REQUESTED'){const sub=await SchoolSubscription.findOne({_id:a.targetId,businessId}).select('customerId').session(session??null).lean();if(sub)return deliver(businessId,[sub.customerId],'SCHOOL_REQUESTED','School request received','Your school transport request is awaiting operator review.',`audit:${a._id}:customer`,session);}return; }
  if (action === 'SCHOOL_CHILD_ENROLLED') return owner('Student profile awaiting review');
  if (action === 'BOOKING_REQUESTED' || action === 'PHONE_BOOKING_REQUESTED' || action === 'QUOTE_ACCEPTED' || action === 'QUOTE_REVISION_REQUESTED') return owner(action === 'QUOTE_ACCEPTED' ? 'Booking quote accepted' : 'Booking request updated');
  if (action === 'PAYMENT_CLAIMED') { await owner('Payment claim awaiting verification'); const payment=await CustomerPayment.findOne({_id:a.targetId,businessId}).select('customerId').session(session??null).lean(); if(payment)return deliver(businessId,[payment.customerId],'PAYMENT_REPORTED','Payment report received','Your claim is pending operator verification.',`audit:${a._id}:customer`,session);return; }
  if (action === 'LEAVE_REQUESTED' || action === 'LEAVE_CALL_RECORDED') return owner('School leave request updated');
  if (action.startsWith('DRIVER_')) { await owner('Driver reported a duty update'); const run=await SchoolRun.findOne({_id:a.targetId,businessId,status:'ACTIVE'}).select('rosterChildIds').session(session??null).lean(); if(run){const children=await SchoolChild.find({_id:{$in:run.rosterChildIds},businessId,status:'ACTIVE'}).select('_id customerId').session(session??null).lean();const links=await GuardianStudentLink.find({businessId,childId:{$in:children.map(c=>c._id)},status:'APPROVED'}).select('customerId').session(session??null).lean();return deliver(businessId,[...children.map(c=>c.customerId),...links.map(l=>l.customerId)],'RUN_DELAY','School run update','The driver reported a route update. Contact the operator for current details.',`audit:${a._id}:guardians`,session);} }
  if (action === 'PAYMENT_VERIFIED' || action === 'PAYMENT_REJECTED' || action === 'PAYMENT_REFUND') { const payment = await CustomerPayment.findOne({ _id: a.targetId, businessId }).select('customerId').session(session??null).lean(); if (payment) return customer(payment.customerId, action === 'PAYMENT_VERIFIED' ? 'Payment verified' : action === 'PAYMENT_REJECTED' ? 'Payment claim rejected' : 'Refund recorded'); }
}
export async function notificationFromLegacyNotice(n: InstanceType<typeof CustomerNotice>) { const recipient = n.studentUserId || n.customerId; if (recipient) await deliver(n.businessId as mongoose.Types.ObjectId, [recipient as mongoose.Types.ObjectId], 'NOTICE', n.title, n.body, `notice:${n._id}`,n.$session()); }

const id = z.string().regex(/^[a-f\d]{24}$/i);
const noticeInput = z.object({ title: z.string().trim().min(3).max(100), body: z.string().trim().min(5).max(1000), audience: z.enum(['SCHOOL_ALL','SCHOOL_ROUTE','BOOKING_CUSTOMER','DRIVERS']), routeId: id.optional(), customerId: id.optional(), category: z.enum(['GENERAL','HOLIDAY','LATE_RUN','BOOKING','PAYMENT']).default('GENERAL') });
const view = (n: InstanceType<typeof Notification>, student=false) => ({ id: String(n._id), kind: n.kind, title: n.title, body: student&&(n.kind==='DUES_REMINDER'||n.title==='School fee reminder')?'Please ask your guardian to review this month’s school transport fee.':n.body, deliveredAt: n.deliveredAt.toISOString(), seenAt: n.seenAt?.toISOString() ?? null, readAt: n.readAt?.toISOString() ?? null });
export function createNotificationRouter(webOrigin: string) {
  const r = Router(); r.use(requireOrigin(webOrigin), requireAuth);
  r.get('/', async (req,res,next) => { try { const u=req.auth!.user; const page=Math.max(1,Math.min(10000,Number(req.query.page)||1)), limit=20, filter={businessId:u.businessId,recipientId:u._id}; const [items,total,unread]=await Promise.all([Notification.find(filter).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit),Notification.countDocuments(filter),Notification.countDocuments({...filter,readAt:null})]); return res.json({items:items.map(n=>view(n,u.role==='STUDENT')),page,limit,total,unread}); } catch(e){return next(e);} });
  r.get('/count', async(req,res,next)=>{try{const u=req.auth!.user;return res.json({unread:await Notification.countDocuments({businessId:u.businessId,recipientId:u._id,readAt:null})});}catch(e){return next(e);}});
  r.post('/seen',requireCsrf,async(req,res,next)=>{const parsed=z.object({ids:z.array(id).min(1).max(20)}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Choose visible notifications.'}});try{const u=req.auth!.user;await Notification.updateMany({_id:{$in:parsed.data.ids},businessId:u.businessId,recipientId:u._id,seenAt:null},{$set:{seenAt:new Date()}});return res.json({ok:true});}catch(e){return next(e);}});
  r.post('/:id/read',requireCsrf,async(req,res,next)=>{if(!id.safeParse(req.params.id).success)return res.status(404).json({error:{code:'NOT_FOUND',message:'Notification not found.'}});try{const u=req.auth!.user;const n=await Notification.findOneAndUpdate({_id:req.params.id,businessId:u.businessId,recipientId:u._id},{$set:{readAt:new Date(),seenAt:new Date()}},{new:true});return n?res.json(view(n,u.role==='STUDENT')):res.status(404).json({error:{code:'NOT_FOUND',message:'Notification not found.'}});}catch(e){return next(e);}});
  return r;
}
export function createOwnerCommunicationRouter(webOrigin: string) {
  const r=Router();r.use(requireOrigin(webOrigin),requireAuth,requireRole('OWNER'));
  r.post('/notices',requireCsrf,async(req,res,next)=>{const p=noticeInput.safeParse(req.body);if(!p.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Check notice details.'}});try{const u=req.auth!.user,x=p.data,businessId=u.businessId as mongoose.Types.ObjectId;let recipients:mongoose.Types.ObjectId[]=[];
    if(x.audience==='SCHOOL_ALL'){const children=await SchoolChild.find({businessId,status:'ACTIVE'}).select('_id customerId').lean();const links=await GuardianStudentLink.find({businessId,childId:{$in:children.map(c=>c._id)},status:'APPROVED'}).select('customerId').lean();const students=await StudentAccess.find({businessId,childId:{$in:children.map(c=>c._id)},status:'ACTIVE'}).select('studentUserId').lean();recipients=[...children.map(c=>c.customerId),...links.map(l=>l.customerId),...students.flatMap(a=>a.studentUserId?[a.studentUserId]:[])];}
    if(x.audience==='SCHOOL_ROUTE'){if(!x.routeId||!await SchoolRoute.exists({_id:x.routeId,businessId,active:true}))return res.status(404).json({error:{code:'NOT_FOUND',message:'Route not found.'}});const children=await SchoolChild.find({businessId,routeId:x.routeId,status:'ACTIVE'}).select('_id customerId').lean();const links=await GuardianStudentLink.find({businessId,childId:{$in:children.map(c=>c._id)},status:'APPROVED'}).select('customerId').lean();const students=await StudentAccess.find({businessId,childId:{$in:children.map(c=>c._id)},status:'ACTIVE'}).select('studentUserId').lean();recipients=[...children.map(c=>c.customerId),...links.map(l=>l.customerId),...students.flatMap(a=>a.studentUserId?[a.studentUserId]:[])];}
    if(x.audience==='BOOKING_CUSTOMER'){if(!x.customerId||!await CustomerBooking.exists({businessId,customerId:x.customerId}))return res.status(404).json({error:{code:'NOT_FOUND',message:'Customer booking not found.'}});recipients=[new mongoose.Types.ObjectId(x.customerId)];}
    if(x.audience==='DRIVERS')recipients=(await User.find({businessId,role:'DRIVER',status:'ACTIVE'}).select('_id').lean()).map(d=>d._id);
    const sourceKey=`owner:${new mongoose.Types.ObjectId()}`;const count=await deliver(businessId,recipients,`OWNER_${x.category}`,x.title,x.body,sourceKey);await AuditEvent.create({businessId,actorId:u._id,targetId:u._id,action:'OWNER_NOTICE_SENT',reason:`${x.audience}; ${count} recipients`});return res.status(201).json({id:sourceKey,count});
  }catch(e){return next(e);}});
  r.get('/enquiries',async(req,res,next)=>{try{const u=req.auth!.user;const page=Math.max(1,Number(req.query.page)||1),limit=20,filter={businessId:u.businessId};const [items,total]=await Promise.all([Enquiry.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Enquiry.countDocuments(filter)]);return res.json({items:items.map(e=>({id:String(e._id),name:e.name,phone:e.phone,service:e.service,message:e.message,status:e.status,createdAt:e.createdAt.toISOString()})),page,limit,total});}catch(e){return next(e);}});
  r.post('/enquiries/:id/handled',requireCsrf,async(req,res,next)=>{if(!id.safeParse(req.params.id).success)return res.status(404).json({error:{code:'NOT_FOUND',message:'Enquiry not found.'}});try{const u=req.auth!.user;const e=await Enquiry.findOneAndUpdate({_id:req.params.id,businessId:u.businessId,status:'NEW'},{$set:{status:'CLOSED'}},{new:true});if(!e)return res.status(404).json({error:{code:'NOT_FOUND',message:'Enquiry not found or already handled.'}});await AuditEvent.create({businessId:u.businessId,actorId:u._id,targetId:e._id,action:'ENQUIRY_HANDLED'});return res.json({id:String(e._id),status:e.status});}catch(error){return next(error);}});
  r.get('/urgent',async(req,res,next)=>{try{const u=req.auth!.user;const items=await UrgentRequest.find({businessId:u.businessId,status:{$in:['NEW','CONTACT_ATTEMPTED']}}).sort({createdAt:-1}).limit(50).lean();return res.json(items.map(x=>({id:String(x._id),phone:x.phone,pickup:x.pickup,status:x.status,createdAt:x.createdAt.toISOString()})));}catch(e){return next(e);}});
  return r;
}
