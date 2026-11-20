import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from './app.js';
import { Business } from './models.js';
import { User } from './auth-models.js';
import { CustomerBooking, CustomerNotice, CustomerPayment, GuardianStudentLink, SchoolChild, SchoolLeave, SchoolSubscription } from './customer-models.js';

const origin = 'http://localhost:5173', app = createApp(origin, false);
const first = request.agent(app), second = request.agent(app);
let mongo: MongoMemoryServer, businessId: mongoose.Types.ObjectId, firstId: string, secondId: string, csrf = '', secondCsrf = '', activeChildId = '';
const subFields = { area:'Central area', pickup:'Main gate stop', drop:'Home gate stop', requestedChildren:2, preferredStartDate:'2026-11-08', contactPhone:'+919100000041' };
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); businessId = (await Business.create({ name: 'SafeRide', phone: '+919100000099' }))._id; });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
async function signup(agent: ReturnType<typeof request.agent>, mobile: string) { return agent.post('/api/auth/signup').set('Origin', origin).send({ name: 'Customer Test', mobile, password: 'LongCustomerPassword1!', acceptTerms: true, acceptPrivacy: true }); }

describe('customer dashboard boundary and actions', () => {
  it('returns an empty, genuine dashboard for a new customer and denies anonymous/owner access', async () => {
    expect((await request(app).get('/api/customer/dashboard')).status).toBe(401);
    const a = await signup(first, '+919100000041'); const b = await signup(second, '+919100000042');
    firstId = a.body.user.id; secondId = b.body.user.id; csrf = a.body.csrfToken; secondCsrf = b.body.csrfToken;
    const empty = await first.get('/api/customer/dashboard');
    expect(empty.status).toBe(200); expect(empty.body.children).toEqual([]); expect(empty.body.subscriptions).toEqual([]); expect(empty.body.ownerPhone).toBe('+919100000099');
  });
  it('shows pending and quoted applications without exposing inactive children', async () => {
    const pending = await SchoolSubscription.create({ ...subFields, businessId, customerId: firstId, school: 'Pending School', status: 'PENDING' });
    await SchoolSubscription.create({ ...subFields, businessId, customerId: firstId, school: 'Quoted School', status: 'QUOTED', monthlyFeePaise: 425000 });
    await SchoolChild.create({ businessId, customerId: firstId, subscriptionId: pending._id, name: 'Not active', school: 'Pending School' });
    const result = await first.get('/api/customer/dashboard');
    expect(result.body.subscriptions.map((s: {status:string}) => s.status)).toEqual(expect.arrayContaining(['PENDING','QUOTED']));
    expect(result.body.children).toEqual([]);
  });
  it('returns only linked active children and never includes another customer records', async () => {
    const sub = await SchoolSubscription.create({ ...subFields, businessId, customerId: firstId, school: 'Active School', status: 'ACTIVE', monthlyFeePaise: 380000 });
    const driver = await User.create({ businessId, role: 'DRIVER', name: 'Driver', mobile: '+919100000043', status: 'ACTIVE' });
    const a = await SchoolChild.create({ businessId, customerId: firstId, subscriptionId: sub._id, name: 'First Child', school: 'Active School', status:'ACTIVE', assignedDriverId: driver._id, rideStatus: 'BOARDED', confirmedAt: new Date(), runActive: true, gpsConsent: true, gpsPermission: 'GRANTED', gpsAt: new Date(), latitude: 18.52, longitude: 73.85 });
    await SchoolChild.create({ businessId, customerId: firstId, subscriptionId: sub._id, name: 'Second Child', school: 'Active School', status:'ACTIVE', gpsPermission: 'DENIED' });
    activeChildId = String(a._id);
    const otherSub = await SchoolSubscription.create({ ...subFields, businessId, customerId: secondId, school: 'Private School', status: 'ACTIVE' });
    const otherChild = await SchoolChild.create({ businessId, customerId: secondId, subscriptionId: otherSub._id, name: 'Secret Child', school: 'Private School' });
    await CustomerBooking.create({ businessId, customerId: firstId, service: 'local', status: 'QUOTED', quotedFarePaise: 100000 });
    await CustomerBooking.create({ businessId, customerId: secondId, service: 'goods', status: 'REQUESTED' });
    await CustomerPayment.create({ businessId, customerId: firstId, status: 'PENDING_VERIFICATION', amountPaise: 50000 });
    await CustomerNotice.create({ businessId, customerId: secondId, title: 'Private', body: 'Secret notice' });
    const result = await first.get('/api/customer/dashboard');
    expect(result.body.children).toHaveLength(2); expect(result.body.children[0].gps.latitude).toBeNull();
    expect(result.body.bookings).toHaveLength(1); expect(result.body.payments[0].status).toBe('PENDING_VERIFICATION');
    expect(JSON.stringify(result.body)).not.toContain('Secret');
    expect(result.body.children[0].runId).toBeNull();
    expect(result.body.children[0].gps.state).toBe('UNAVAILABLE');
    expect((await first.get(`/api/customer/children/${otherChild._id}/location`)).status).toBe(404);
    expect((await second.get(`/api/customer/children/${activeChildId}/location`)).status).toBe(404);
  });
  it('withholds stale or unauthorized GPS and scopes leave requests', async () => {
    await SchoolChild.updateOne({ _id: activeChildId }, { $set: { gpsAt: new Date(Date.now() - 10 * 60_000) } });
    expect((await first.get('/api/customer/dashboard')).body.children[0].gps.state).toBe('UNAVAILABLE');
    const date = new Date(Date.now() + 86400_000).toISOString().slice(0,10);
    expect((await second.post('/api/leaves').set('Origin', origin).set('x-csrf-token', secondCsrf).send({ childId: activeChildId, date })).status).toBe(404);
    expect((await first.post('/api/leaves').set('Origin', origin).set('x-csrf-token', csrf).send({ childId: activeChildId, date })).status).toBe(201);
    expect(await SchoolLeave.countDocuments({ businessId, customerId: firstId, childId: activeChildId, status: 'REQUESTED' })).toBe(1);
  });
  it('shows a child to a separately approved guardian without exposing fee or booking records', async () => {
    await GuardianStudentLink.create({ businessId, childId: activeChildId, customerId: secondId, status: 'APPROVED', primary: false, proofNote: 'Owner reviewed family relationship' });
    const dashboard = await second.get('/api/customer/dashboard');
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.children.map((child: { id: string }) => child.id)).toContain(activeChildId);
    expect(dashboard.body.subscriptions.every((sub: { school: string }) => sub.school !== 'Active School')).toBe(true);
    expect(dashboard.body.bookings).toHaveLength(1);
    expect(dashboard.body.children.find((child: {id:string})=>child.id===activeChildId).gps.state).toBe('UNAVAILABLE');
    const futureDate = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10);
    expect((await second.post('/api/leaves').set('Origin', origin).set('x-csrf-token', secondCsrf).send({ childId: activeChildId, date: futureDate, reason: 'Family appointment' })).status).toBe(201);
    expect(await SchoolLeave.countDocuments({ businessId, customerId: firstId, childId: activeChildId, date: futureDate })).toBe(1);
  });
});

