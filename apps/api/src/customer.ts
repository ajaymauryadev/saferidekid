import { Router } from 'express';
import { CustomerDashboardSchema } from '@saferide/shared';
import { requireAuth, requireOrigin, requireRole } from './auth.js';
import { User } from './auth-models.js';
import { Business, SchoolRoute, Vehicle } from './models.js';
import { CustomerBooking, CustomerNotice, CustomerPayment, GuardianStudentLink, SchoolChild, SchoolSubscription } from './customer-models.js';
import { SchoolRun, RunStudentEvent } from './run-models.js';
import { effective } from './runs.js';
import { TripLocation } from './tracking.js';

const safePhone = (value: unknown) => typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value) ? value : null;
const iso = (value: Date | null | undefined) => value ? value.toISOString() : null;
export function createCustomerRouter(webOrigin: string) {
  const router = Router();
  router.use(requireOrigin(webOrigin), requireAuth, requireRole('CUSTOMER'));
  router.get('/dashboard', async (req, res, next) => {
    try {
      const { businessId, _id: customerId } = req.auth!.user;
      const filter = { businessId, customerId };
      const links = await GuardianStudentLink.find({ businessId, customerId, status: 'APPROVED' }).select('childId').lean();
      const [subscriptions, children, bookings, payments, notices, business] = await Promise.all([
        SchoolSubscription.find(filter).sort({ updatedAt: -1 }).lean(),
        SchoolChild.find({ businessId, $or: [{ customerId }, { _id: { $in: links.map(link => link.childId) } }], status: 'ACTIVE' }).lean(),
        CustomerBooking.find(filter).sort({ updatedAt: -1 }).limit(50).lean(),
        CustomerPayment.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
        CustomerNotice.find({ businessId, customerId, studentUserId:null }).sort({ createdAt: -1 }).limit(50).lean(),
        Business.findOne({ _id: businessId }).select('phone').lean()
      ]);
      const activeSubscriptions = await SchoolSubscription.find({ businessId, _id: { $in: children.map(child => child.subscriptionId) }, status: 'ACTIVE' }).select('_id').lean();
      const activeIds = new Set(activeSubscriptions.map(s => String(s._id)));
      const activeChildren = children.filter(c => activeIds.has(String(c.subscriptionId)));
      const runDate = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
      const runs = await SchoolRun.find({ businessId, date: runDate, $or: [{ rosterChildIds: { $in: activeChildren.map(c => c._id) } }, { rosterChildIds: { $exists: false }, routeId: { $in: activeChildren.map(c => c.routeId).filter(Boolean) } }] }).sort({ startedAt: 1 });
      const locations = await TripLocation.find({ businessId, kind:'run',tripId:{$in:runs.filter(r=>r.status==='ACTIVE').map(r=>r._id)} }).lean();
      const runEvents = await RunStudentEvent.find({ businessId, runId: { $in: runs.map(r => r._id) }, childId: { $in: activeChildren.map(c => c._id) } }).sort({ at: 1, _id: 1 });
      const driverIds = runs.map(r=>r.driverId);
      const [drivers,routes,vehicles] = await Promise.all([User.find({ _id: { $in: driverIds }, businessId, status: 'ACTIVE', $or:[{role:'DRIVER'},{role:'OWNER',abilities:'DRIVER_DUTY'}] }).select('name mobile').lean(),SchoolRoute.find({businessId,_id:{$in:runs.map(r=>r.routeId)}}).select('name driverId vehicleId active').lean(),Vehicle.find({businessId,_id:{$in:runs.map(r=>r.vehicleId)}}).select('name registration').lean()]);
      const phones = new Map(drivers.map(d => [String(d._id), safePhone(d.mobile)]));
      const driverNames = new Map(drivers.map(d => [String(d._id), d.name]));
      const routeNames = new Map(routes.map(r=>[String(r._id),r.name]));
      const vehicleNames = new Map(vehicles.map(v=>[String(v._id),`${v.name}${v.registration?` · ${v.registration}`:''}`]));
      const activeDrivers = new Set(drivers.map(d => String(d._id)));
      const result = {
        subscriptions: subscriptions.map(s => ({ id: String(s._id), school: s.school, status: s.status, monthlyFeePaise: s.monthlyFeePaise ?? null })),
        children: activeChildren.map(c => { const related=runs.filter(r=>r.rosterChildIds?.some(childId=>String(childId)===String(c._id))||!r.rosterChildIds&&String(r.routeId)===String(c.routeId));const run=related.find(r=>r.status==='ACTIVE'&&r.session==='afternoon')??related.find(r=>r.status==='ACTIVE');const latest=run??related.at(-1);const childEvents=runEvents.filter(e=>String(e.childId)===String(c._id));const state=effective(childEvents.filter(e=>String(e.runId)===String(latest?._id)));const point=locations.find(p=>String(p.tripId)===String(run?._id)&&String(p.driverId)===String(run?.driverId)&&String(p.vehicleId)===String(run?.vehicleId));const age=point?.observedAt?Date.now()-point.observedAt.getTime():Infinity;const assigned=latest&&activeDrivers.has(String(latest.driverId))&&routes.some(r=>String(r._id)===String(latest.routeId)&&r.active&&String(r.driverId)===String(latest.driverId)&&String(r.vehicleId)===String(latest.vehicleId));return { id: String(c._id), name: c.name, school: c.school, className: c.className ?? null, subscriptionId: String(c.subscriptionId), runActive:!!run,runId:run?String(run._id):null, rideStatus: state.action, confirmedAt: state.at, journey: childEvents.map(e => ({ action: e.action, at: e.at.toISOString(), reason: e.reason ?? null, correctedAction: e.correctedAction ?? null, originalAction: e.correctedEventId ? childEvents.find(original => String(original._id) === String(e.correctedEventId))?.action ?? null : null })), driverName:assigned?driverNames.get(String(latest.driverId))??null:null,driverPhone:assigned?phones.get(String(latest.driverId))??null:null,vehicleName:latest?vehicleNames.get(String(latest.vehicleId))??null:null,routeName:latest?routeNames.get(String(latest.routeId))??null:null,session:latest?.session??null, gps: { state: !run||!assigned||!point?'UNAVAILABLE' as const:!point.sharing?'DENIED' as const:point.observedAt&&age>=-30_000&&age<=120_000?'FRESH' as const:point.observedAt?'STALE' as const:'UNAVAILABLE' as const, observedAt: assigned&&point?.sharing?iso(point.observedAt):null, latitude: null, longitude: null } };}),
        bookings: bookings.map(b => ({ id: String(b._id), service: b.service, status: b.status, scheduledAt: iso(b.scheduledAt), quotedFarePaise: b.quotedFarePaise ?? null })),
        payments: payments.map(p => ({ id: String(p._id), status: p.status, amountPaise: p.amountPaise, createdAt: p.createdAt.toISOString() })),
        notices: notices.map(n => ({ id: String(n._id), title: n.title, body: n.body, createdAt: n.createdAt.toISOString() })),
        ownerPhone: safePhone(business?.phone)
      };
      return res.json(CustomerDashboardSchema.parse(result));
    } catch (error) { return next(error); }
  });
  return router;
}



