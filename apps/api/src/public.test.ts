import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from './app.js';
import { Business, Enquiry, Vehicle, findOwnerEnquiries } from './models.js';

const app = createApp('http://localhost:5173');
let mongo: MongoMemoryServer;
let businessId: mongoose.Types.ObjectId;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const business = await Business.create({ key: 'primary', name: 'SafeRide', phone: '+919876543210', serviceArea: 'Test district', privateBankAccount: 'never public' });
  businessId = business._id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

describe('public data and enquiries', () => {
  it('never guesses an address when reverse geocoding is unconfigured', async () => {
    const previous = process.env.REVERSE_GEOCODER_URL;
    delete process.env.REVERSE_GEOCODER_URL;
    try {
      const invalid = await request(app).post('/api/public/reverse-location').send({ latitude: 99, longitude: 80 });
      expect(invalid.status).toBe(400);
      const unavailable = await request(app).post('/api/public/reverse-location').send({ latitude: 28.5, longitude: 80.7 });
      expect(unavailable.status).toBe(503);
      expect(unavailable.body.error.code).toBe('LOOKUP_NOT_CONFIGURED');
      expect(unavailable.body).not.toHaveProperty('address');
    } finally { if (previous) process.env.REVERSE_GEOCODER_URL = previous; }
  });
  it('returns only configured public business fields', async () => {
    const response = await request(app).get('/api/public/business');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'SafeRide', contactName: null, tagline: null, phone: '+919876543210', email: null, whatsapp: null, serviceArea: 'Test district', businessHours: null, logoUrl: null, serviceAreas: [], homepageHeadline: '', homepageDescription: '' });
  });
  it('filters private fleet records and fields, including goods suitability', async () => {
    await Vehicle.create([
      { businessId, name: 'Passenger van', type: 'PASSENGER_VAN', seats: 7, services: ['school', 'local', 'goods'], publicVisible: true, registration: 'PRIVATE-REG', driverId: new mongoose.Types.ObjectId(), privateNotes: 'PRIVATE_NOTE', imageUrl: 'javascript:alert(1)' },
      { businessId, name: 'Goods pickup', type: 'GOODS_PICKUP', services: ['goods', 'school'], publicVisible: true, legalSuitabilityConfirmed: true },
      { businessId, name: 'Unverified goods pickup', type: 'GOODS_PICKUP', services: ['goods'], publicVisible: true },
      { businessId, name: 'Hidden van', type: 'PASSENGER_VAN', publicVisible: false },
      { businessId: new mongoose.Types.ObjectId(), name: 'Other business', type: 'CAR', publicVisible: true }
    ]);
    const response = await request(app).get('/api/public/vehicles');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    const passenger = response.body.find((v: {name:string}) => v.name === 'Passenger van');
    const goods = response.body.find((v: {name:string}) => v.name === 'Goods pickup');
    expect(passenger.services).toEqual(['school', 'local']);
    expect(passenger.imageUrl).toBeNull();
    expect(goods.services).toEqual(['goods']);
    expect(goods.seats).toBeNull();
    expect(JSON.stringify(response.body)).not.toMatch(/registration|driverId|routeIds|privateNotes|PRIVATE/);
  });
  it('validates, persists and scopes enquiries without a public owner read route', async () => {
    const bad = await request(app).post('/api/public/enquiries').send({ name: 'A', phone: 'bad', service: 'school', message: 'short' });
    expect(bad.status).toBe(400);
    const created = await request(app).post('/api/public/enquiries').send({ name: 'A Customer', phone: '+91 98765 43210', service: 'school', message: 'Please tell me about a school route.' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('RECEIVED');
    expect(created.body).not.toHaveProperty('phone');
    const stored = await Enquiry.findById(created.body.id).lean();
    expect(stored?.businessId.toString()).toBe(businessId.toString());
    expect(stored?.phone).toBe('+919876543210');
    expect(stored?.status).toBe('NEW');
    const ownerRecords = await findOwnerEnquiries(businessId);
    expect(ownerRecords.some(record => String(record._id) === created.body.id)).toBe(true);
    expect(await findOwnerEnquiries(new mongoose.Types.ObjectId())).toHaveLength(0);
    const publicRead = await request(app).get(`/api/public/enquiries/${created.body.id}`);
    const prematureOwnerRead = await request(app).get('/api/owner/enquiries');
    expect(publicRead.status).toBe(404);
    expect(prematureOwnerRead.status).toBe(401);
  });
  it('limits repeat enquiries from the same phone', async () => {
    const payload = { name: 'Repeat Customer', phone: '+12025550199', service: 'local', message: 'I would like to ask about a family journey.' };
    for (let i=0;i<3;i++) expect((await request(app).post('/api/public/enquiries').send(payload)).status).toBe(201);
    const limited = await request(app).post('/api/public/enquiries').send(payload);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });
});
