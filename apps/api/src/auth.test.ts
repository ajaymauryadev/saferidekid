import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from './app.js';
import { Business } from './models.js';
import { ActionToken, AuditEvent, Session, User } from './auth-models.js';
import { bootstrapOwner } from './owner-bootstrap.js';

const app = createApp('http://localhost:5173', false);
const origin = 'http://localhost:5173';
const customer = request.agent(app), owner = request.agent(app), driver = request.agent(app);
let mongo: MongoMemoryServer;
let businessId: mongoose.Types.ObjectId, ownerId: string, customerId: string, driverId: string;
let ownerCsrf = '', customerCsrf = '', driverCsrf = '';
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  businessId = (await Business.create({ key: 'primary', name: 'SafeRide' }))._id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('one server-derived identity and private provisioning', () => {
  it('marks production session cookies Secure', async () => {
    const secureApp=createApp('https://saferide.example',true,['saferide.example']);
    const signup=await request(secureApp).post('/api/auth/signup').set('Host','saferide.example').set('Origin','https://saferide.example').send({name:'Fictitious Secure Customer',mobile:'+919100009099',password:'LongCustomerPassword1!',acceptTerms:true,acceptPrivacy:true});
    expect(signup.status).toBe(201);
    expect(signup.headers['set-cookie'][0]).toMatch(/HttpOnly.*Secure.*SameSite=Lax/);
  });
  it('registers one customer, establishes a cookie session, and rejects duplicates without echoing account details', async () => {
    const missingConsent = await request(app).post('/api/auth/signup').set('Origin', origin).send({ name: 'Customer One', mobile: '+919100000001', password: 'LongCustomerPassword1!' });
    expect(missingConsent.status).toBe(400);
    const signup = await customer.post('/api/auth/signup').set('Origin', origin).send({ name: 'Customer One', mobile: '+919100000001', email: 'customer@example.com', password: 'LongCustomerPassword1!', acceptTerms: true, acceptPrivacy: true });
    expect(signup.status).toBe(201);
    expect(signup.body.user.role).toBe('CUSTOMER');
    expect(signup.body.user.contactVerified).toBe(false);
    expect(signup.body.user).not.toHaveProperty('passwordHash');
    expect(signup.headers['set-cookie'][0]).toMatch(/HttpOnly.*SameSite=Lax/);
    customerId = signup.body.user.id; customerCsrf = signup.body.csrfToken;
    const me = await customer.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(customerId);
    const duplicate = await request(app).post('/api/auth/signup').set('Origin', origin).send({ name: 'Another', mobile: '+919100000001', email: '', password: 'LongCustomerPassword2!', acceptTerms: true, acceptPrivacy: true });
    expect(duplicate.status).toBe(409);
    expect(JSON.stringify(duplicate.body)).not.toContain('+919100000001');
    const user = await User.findById(customerId).select('+passwordHash');
    expect(user?.role).toBe('CUSTOMER');
    expect(user?.passwordHash).not.toBe('LongCustomerPassword1!');
    expect(user?.termsAcceptedAt).toBeTruthy();
    expect(user?.termsVersion).toBe('2026-11-08');
  });
  it('enforces origin and CSRF, logs out and revokes the old cookie', async () => {
    expect((await customer.post('/api/auth/logout').set('Origin', origin)).status).toBe(403);
    expect((await customer.post('/api/auth/logout').set('Origin', 'https://evil.example').set('x-csrf-token', customerCsrf)).status).toBe(403);
    expect((await customer.post('/api/auth/logout').set('Origin', origin).set('x-csrf-token', customerCsrf)).status).toBe(204);
    expect((await customer.get('/api/auth/me')).status).toBe(401);
    const login = await customer.post('/api/auth/login').set('Origin', origin).send({ identifier: 'customer@example.com', password: 'LongCustomerPassword1!' });
    expect(login.status).toBe(200);
    expect(login.body.user.id).toBe(customerId);
    const priorCookie = login.headers['set-cookie'][0].split(';')[0];
    const switched = await customer.post('/api/auth/login').set('Origin', origin).send({ identifier: 'customer@example.com', password: 'LongCustomerPassword1!' });
    expect(switched.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Cookie', priorCookie)).status).toBe(401);
    customerCsrf = switched.body.csrfToken;
  });
  it('bootstraps exactly one owner and derives owner role on login', async () => {
    const created = await bootstrapOwner({ name: 'Owner One', mobile: '+919100000002', password: 'LongOwnerPassword1!' });
    ownerId = String(created._id);
    await expect(bootstrapOwner({ name: 'Another Owner', mobile: '+919100000003', password: 'LongOwnerPassword2!' })).rejects.toThrow('one-time');
    const login = await owner.post('/api/auth/login').set('Origin', origin).send({ identifier: '+919100000002', password: 'LongOwnerPassword1!' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('OWNER');
    ownerCsrf = login.body.csrfToken;
  });
  it('invites a driver privately, activates once, resets with an owner-issued token and revokes sessions', async () => {
    expect((await owner.post('/api/owner/users/invite-driver').set('Origin', origin).send({ name: 'Driver One', mobile: '+919100000004' })).status).toBe(403);
    const invite = await owner.post('/api/owner/users/invite-driver').set('Origin', origin).set('x-csrf-token', ownerCsrf).send({ name: 'Driver One', mobile: '+919100000004' });
    expect(invite.status).toBe(201);
    driverId = invite.body.id;
    expect(invite.body.activationToken.length).toBeGreaterThan(32);
    const invited = await User.findById(driverId).select('+passwordHash');
    expect(invited?.status).toBe('INVITED');
    expect(invited?.passwordHash).toBeNull();
    const accepted = await request(app).post('/api/auth/accept-invite').set('Origin', origin).send({ token: invite.body.activationToken, password: 'LongDriverPassword1!' });
    expect(accepted.status).toBe(200);
    expect((await request(app).post('/api/auth/accept-invite').set('Origin', origin).send({ token: invite.body.activationToken, password: 'LongDriverPassword2!' })).status).toBe(400);
    const login = await driver.post('/api/auth/login').set('Origin', origin).send({ identifier: '+919100000004', password: 'LongDriverPassword1!' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('DRIVER');
    driverCsrf = login.body.csrfToken;
    const reset = await owner.post(`/api/owner/users/${driverId}/reset`).set('Origin', origin).set('x-csrf-token', ownerCsrf).send({ reason: 'Driver requested assisted recovery' });
    expect(reset.status).toBe(200);
    expect((await driver.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).post('/api/auth/reset-password').set('Origin', origin).send({ token: reset.body.resetToken, password: 'NewDriverPassword1!' })).status).toBe(200);
    expect((await request(app).post('/api/auth/reset-password').set('Origin', origin).send({ token: reset.body.resetToken, password: 'NewDriverPassword2!' })).status).toBe(400);
    const relogin = await driver.post('/api/auth/login').set('Origin', origin).send({ identifier: '+919100000004', password: 'NewDriverPassword1!' });
    expect(relogin.status).toBe(200);
    driverCsrf = relogin.body.csrfToken;
    expect(await ActionToken.countDocuments({ userId: driverId, consumedAt: { $ne: null } })).toBe(2);
  });
  it('blocks unauthenticated, wrong-role and cross-business reads; deactivation revokes immediately', async () => {
    expect((await request(app).get(`/api/owner/users/${driverId}`)).status).toBe(401);
    expect((await customer.get(`/api/owner/users/${driverId}`)).status).toBe(403);
    const otherBusiness = await Business.create({ key: 'other', name: 'Other Operator' });
    const otherUser = await User.create({ businessId: otherBusiness._id, role: 'CUSTOMER', name: 'Other Customer', mobile: '+919100000005', passwordHash: 'not-used' });
    expect((await owner.get(`/api/owner/users/${otherUser._id}`)).status).toBe(404);
    expect((await owner.post(`/api/owner/users/${otherUser._id}/reset`).set('Origin', origin).set('x-csrf-token', ownerCsrf).send({ reason: 'Test cross-business denial' })).status).toBe(404);
    const ownDriver = await owner.get(`/api/owner/users/${driverId}`);
    expect(ownDriver.status).toBe(200);
    expect(ownDriver.body).not.toHaveProperty('passwordHash');
    const deactivate = await owner.post(`/api/owner/users/${driverId}/deactivate`).set('Origin', origin).set('x-csrf-token', ownerCsrf).send({ reason: 'Driver left the business' });
    expect(deactivate.status).toBe(200);
    expect((await driver.get('/api/auth/me')).status).toBe(401);
    expect((await owner.post(`/api/owner/users/${ownerId}/deactivate`).set('Origin', origin).set('x-csrf-token', ownerCsrf).send({ reason: 'Self deactivation attempt' })).status).toBe(403);
    expect(await AuditEvent.countDocuments({ businessId, action: 'USER_DEACTIVATED' })).toBe(1);
    void driverCsrf;
  });
  it('locks repeated invalid login attempts without revealing whether an account exists', async () => {
    for (let i=0;i<4;i++) {
      const result = await request(app).post('/api/auth/login').set('Origin', origin).send({ identifier: 'unknown@example.com', password: 'wrong-password' });
      expect(result.status).toBe(401);
      expect(result.body.error.message).toBe('Invalid login ID or password.');
    }
    const locked = await request(app).post('/api/auth/login').set('Origin', origin).send({ identifier: 'unknown@example.com', password: 'wrong-password' });
    expect(locked.status).toBe(429);
    expect((await request(app).post('/api/auth/login').set('Origin', origin).send({ identifier: 'unknown@example.com', password: 'wrong-password' })).status).toBe(429);
  });
  it('keeps customer identity unified and offers no public student or role selector endpoint', async () => {
    const me = await customer.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(customerId);
    expect(me.body.user.role).toBe('CUSTOMER');
    expect((await request(app).post('/api/auth/signup').set('Origin', origin).send({ name: 'Would-be Owner', mobile: '+919100000006', password: 'LongPasswordHere1!', role: 'OWNER', acceptTerms: true, acceptPrivacy: true })).body.user.role).toBe('CUSTOMER');
  });
  it('grants owner driver duty only by an explicit, audited ability change', async () => {
    const changed = await owner.post(`/api/owner/users/${ownerId}/driver-duty`).set('Origin', origin).set('x-csrf-token', ownerCsrf).send({ enabled: true, reason: 'Owner will cover a school run' });
    expect(changed.status).toBe(200);
    expect(changed.body.abilities).toEqual(['DRIVER_DUTY']);
    expect((await owner.get('/api/auth/me')).status).toBe(401);
    const relogin = await owner.post('/api/auth/login').set('Origin', origin).send({ identifier: '+919100000002', password: 'LongOwnerPassword1!' });
    expect(relogin.status).toBe(200);
    expect(relogin.body.user.role).toBe('OWNER');
    expect(relogin.body.user.abilities).toContain('DRIVER_DUTY');
    expect(await AuditEvent.countDocuments({ businessId, action: 'DRIVER_DUTY_GRANTED' })).toBe(1);
  });
  it('expires sessions server-side even if a browser still has the cookie', async () => {
    await Session.updateMany({ userId: customerId, revokedAt: null }, { $set: { expiresAt: new Date(Date.now()-1000) } });
    expect((await customer.get('/api/auth/me')).status).toBe(401);
  });
});
