import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Business, Vehicle } from './models.js';
import { DISTANCE_UNAVAILABLE, estimateJourney, fareBreakdown, roadRoute } from './fare-estimate.js';
import type { BookingInput } from '@saferide/shared';

let mongo: MongoMemoryServer;
const originalKey = process.env.ORS_API_KEY;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterEach(async () => { vi.unstubAllGlobals(); if (originalKey === undefined) delete process.env.ORS_API_KEY; else process.env.ORS_API_KEY = originalKey; await Business.deleteMany({}); await Vehicle.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
const rate = (vehicleId: string) => ({ vehicleId, service: 'local' as const, basePaise: 5000, perKmPaise: 1000, perHourPaise: 0, fullDayPaise: 0, minimumPaise: 0, roundTripMultiplier: 200, nightPaise: 2000, waitingPerHourPaise: 500, tollPaise: 300, parkingPaise: 200, discountPaise: 0 });
const input = (): BookingInput => { const day=new Date(Date.now()+3*86400_000).toISOString().slice(0,10);return { service: 'local', pickup: 'Village main square', destination: 'Town railway station', startAt: new Date(`${day}T12:00:00+05:30`).toISOString(), endAt: new Date(`${day}T14:00:00+05:30`).toISOString(), passengers: 2, cargoKg: 0, roundTrip: false, plannedWaitingMinutes: 0, stops: [], notes: '', requestKey: crypto.randomUUID() }; };
function mockRoute() {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (resource: URL | string) => {
    const url = String(resource); calls.push(url);
    if (url.includes('/pelias/v1/search')) return { ok: true, json: async () => ({ features: [{ geometry: { coordinates: url.includes('Village') ? [80, 26] : [80.1, 26.1] }, properties: { confidence: 0.95 } }] }) };
    return { ok: true, json: async () => ({ routes: [{ summary: { distance: 12000 } }] }) };
  }));
  return calls;
}
describe('road routing and server fare snapshots', () => {
  it('uses the configured HeiGIT road route and a 12 km rate in integer paise', async () => {
    process.env.ORS_API_KEY = 'test-key'; const calls = mockRoute();
    const business = await Business.create({ name: 'SafeRide' });
    const vehicle = await Vehicle.create({ businessId: business._id, name: 'Family van', type: 'PASSENGER_VAN', seats: 7, services: ['local'], active: true, legalSuitabilityConfirmed: true });
    business.bookingRates = [rate(String(vehicle._id))]; business.bookingRatesVersion = 3; await business.save();
    const result = await estimateJourney(business._id, input());
    expect(result).toMatchObject({ status: 'ESTIMATED', distanceSource: 'ROUTING_PROVIDER', distanceKm: 12, estimatePaise: 17500, rateVersion: 3, vehicleId: String(vehicle._id) });
    expect(result.breakdown).toMatchObject({ basePaise: 5000, distancePaise: 12000, tollPaise: 300, parkingPaise: 200, totalPaise: 17500 });
    expect(result.routeObservation?.attribution).toContain('OpenStreetMap contributors');
    expect(calls).toHaveLength(3);
    expect(calls[2]).toContain('api.heigit.org/openrouteservice/v2/directions/driving-car');
  });
  it('applies return factor, minimum, night, waiting, hourly and day packages without floating paise', () => {
    const base = rate(new mongoose.Types.ObjectId().toString());
    const daytime = new Date('2026-11-21T10:00:00+05:30');
    expect(fareBreakdown(base, 12000, daytime, new Date(daytime.getTime() + 2 * 3600_000), true).totalPaise).toBe(29500);
    expect(fareBreakdown({ ...base, minimumPaise: 50000 }, 12000, daytime, new Date(daytime.getTime() + 2 * 3600_000), false).totalPaise).toBe(50000);
    const night = new Date('2026-11-21T21:30:00+05:30');
    expect(fareBreakdown(base, 1001, night, new Date(night.getTime() + 2 * 3600_000), false, 61).totalPaise).toBe(9501);
    expect(fareBreakdown(base, 1001, night, new Date(night.getTime() + 40 * 60_000), false).nightPaise).toBe(2000);
    const packages = { ...base, perHourPaise: 2500, fullDayPaise: 12000 };
    expect(fareBreakdown(packages, 12000, daytime, new Date(daytime.getTime() + 3 * 3600_000), false).timePaise).toBe(7500);
    expect(fareBreakdown(packages, 12000, daytime, new Date(daytime.getTime() + 9 * 3600_000), false).timePaise).toBe(12000);
  });
  it('keeps booking open with exact fallback when provider is absent, times out or cannot match a village', async () => {
    const b = await Business.create({ name: 'SafeRide' });
    expect((await estimateJourney(b._id, input())).message).toBe(DISTANCE_UNAVAILABLE);
    process.env.ORS_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ features: [] }) })));
    expect(await roadRoute(input())).toBeNull();
    expect((await estimateJourney(b._id, input())).message).toBe(DISTANCE_UNAVAILABLE);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('Timed out', 'AbortError'); }));
    expect((await estimateJourney(b._id, input())).message).toBe(DISTANCE_UNAVAILABLE);
  });
});
