import mongoose from 'mongoose';
import { z } from 'zod';
import { BookingEstimateSchema, BookingRateSchema, type BookingEstimate, type BookingInput } from '@saferide/shared';
import { Business, Vehicle } from './models.js';

export const DISTANCE_UNAVAILABLE = 'Distance unavailable — owner will confirm the fare.';
export const ROUTE_ATTRIBUTION = '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors';
function providerBase() {
  const configured = process.env.ORS_API_BASE_URL;
  if (!configured) return 'https://api.heigit.org';
  try {
    const url = new URL(configured);
    if (url.origin === 'https://api.heigit.org') return url.origin;
    if (process.env.NODE_ENV === 'test' && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)) return url.origin;
  } catch { /* Invalid configuration uses the safe default. */ }
  return 'https://api.heigit.org';
}
const point = z.tuple([z.number().finite().min(-180).max(180), z.number().finite().min(-90).max(90)]);
const geocodeResponse = z.object({ features: z.array(z.object({ geometry: z.object({ coordinates: point }), properties: z.object({ confidence: z.number().min(0).max(1).optional() }) })).max(20) });
const routeResponse = z.object({ routes: z.array(z.object({ summary: z.object({ distance: z.number().finite().positive().max(10_000_000) }) })).min(1) });
type Coordinates = z.infer<typeof point>;

async function geocode(text: string, key: string, signal: AbortSignal): Promise<Coordinates | null> {
  const url = new URL('/pelias/v1/search', providerBase());
  url.searchParams.set('text', text);
  url.searchParams.set('size', '1');
  const response = await fetch(url, { headers: { Authorization: key, Accept: 'application/json', 'User-Agent': 'SafeRide/0.1 (booking road distance)' }, signal });
  if (!response.ok) return null;
  const result = geocodeResponse.safeParse(await response.json());
  const first = result.success ? result.data.features[0] : null;
  // A loose name match is not a reliable pickup point for a fare.
  return first && (first.properties.confidence ?? 0) >= 0.8 ? first.geometry.coordinates : null;
}

export async function roadRoute(input: Pick<BookingInput, 'pickup' | 'destination' | 'pickupPoint' | 'destinationPoint'>, key = process.env.ORS_API_KEY): Promise<{ distanceMeters: number; observedAt: string } | null> {
  if (!key?.trim()) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const from: Coordinates | null = input.pickupPoint ? [input.pickupPoint.longitude, input.pickupPoint.latitude] : await geocode(input.pickup, key, controller.signal);
      const to: Coordinates | null = input.destinationPoint ? [input.destinationPoint.longitude, input.destinationPoint.latitude] : await geocode(input.destination, key, controller.signal);
      if (!from || !to) return null;
      const response = await fetch(`${providerBase()}/openrouteservice/v2/directions/driving-car`, { method: 'POST', headers: { Authorization: key, 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'SafeRide/0.1 (booking road distance)' }, body: JSON.stringify({ coordinates: [from, to], instructions: false, geometry: false }), signal: controller.signal });
      if (!response.ok) return null;
      const route = routeResponse.safeParse(await response.json());
      if (!route.success) return null;
      return { distanceMeters: route.data.routes[0].summary.distance, observedAt: new Date().toISOString() };
    } finally { clearTimeout(timeout); }
  } catch { return null; }
}

export function fareBreakdown(rate: z.infer<typeof BookingRateSchema>, distanceMeters: number, startAt: Date, endAt: Date, roundTrip: boolean, waitingMinutes = 0) {
  const multiplier = roundTrip ? rate.roundTripMultiplier : 100;
  const chargeableKm = Math.round(distanceMeters * multiplier / 100) / 1000;
  const distancePaise = Math.round(distanceMeters * rate.perKmPaise * multiplier / 100_000);
  const hours = (endAt.getTime() - startAt.getTime()) / 3_600_000;
  const timeMode = rate.fullDayPaise > 0 && hours >= 8 ? 'DAY' : rate.perHourPaise > 0 ? 'HOUR' : 'NONE';
  const timePaise = timeMode === 'DAY' ? Math.ceil(hours / 24) * rate.fullDayPaise : timeMode === 'HOUR' ? Math.ceil(hours) * rate.perHourPaise : 0;
  let night = false;
  const indiaOffset = 5.5 * 3_600_000;
  const firstHour = Math.floor((startAt.getTime() + indiaOffset) / 3_600_000) * 3_600_000 - indiaOffset;
  for (let ms = firstHour; ms <= endAt.getTime(); ms += 3_600_000) {
    const hour = new Date(ms + indiaOffset).getUTCHours();
    if (hour >= 22 || hour < 6) { night = true; break; }
  }
  const nightPaise = night ? rate.nightPaise : 0;
  const waitingPaise = Math.ceil(waitingMinutes / 60) * rate.waitingPerHourPaise;
  const subtotal = Math.max(0, rate.basePaise + distancePaise + timePaise + nightPaise + waitingPaise + rate.tollPaise + rate.parkingPaise - rate.discountPaise);
  const minimumAdjustmentPaise = Math.max(0, rate.minimumPaise - subtotal);
  const assumptions = [roundTrip ? `Return distance factor ${multiplier}%` : 'One way road route', timeMode === 'DAY' ? 'Day package from reserved interval' : timeMode === 'HOUR' ? 'Hourly charge rounded up from reserved interval' : 'No time package', night ? 'Night charge applies to the selected interval' : 'No night charge', waitingMinutes ? `Planned waiting ${waitingMinutes} minutes, rounded up to hours` : 'Unplanned waiting is not priced', 'Tolls and parking are configured allowances; actual extras may change'];
  return { basePaise: rate.basePaise, distancePaise, timePaise, nightPaise, waitingPaise, tollPaise: rate.tollPaise, parkingPaise: rate.parkingPaise, discountPaise: rate.discountPaise, minimumAdjustmentPaise, totalPaise: subtotal + minimumAdjustmentPaise, chargeableKm, timeMode, assumptions } as const;
}

export async function estimateJourney(businessId: mongoose.Types.ObjectId, input: BookingInput): Promise<BookingEstimate> {
  const unavailable = (message = DISTANCE_UNAVAILABLE): BookingEstimate => BookingEstimateSchema.parse({ status: 'UNAVAILABLE', message, distanceSource: 'UNAVAILABLE', distanceKm: null, estimatePaise: null, vehicleId: null, vehicleName: null, rateVersion: null, rateSnapshot: null, breakdown: null, routeObservation: null, calculatedAt: null });
  const route = await roadRoute(input);
  if (!route) return unavailable();
  const business = await Business.findById(businessId).select('bookingRates bookingRatesVersion').lean();
  if (!business) return unavailable();
  const rates = BookingRateSchema.array().safeParse(business.bookingRates);
  if (!rates.success) return unavailable('Road distance available; owner will confirm the fare.');
  const vehicles = await Vehicle.find({ businessId, active: true, legalSuitabilityConfirmed: true, services: input.service, documentExpiry: { $not: { $lt: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) } }, ...(input.service === 'goods' ? { type: 'GOODS_PICKUP', cargoPayloadKg: { $gte: input.cargoKg } } : { type: { $in: ['CAR', 'PASSENGER_VAN'] }, seats: { $gte: input.passengers } }) }).select('name').lean();
  const names = new Map(vehicles.map(vehicle => [String(vehicle._id), vehicle.name]));
  const candidates = rates.data.filter(rate => rate.service === input.service && names.has(rate.vehicleId)).map(rate => ({ rate, breakdown: fareBreakdown(rate, route.distanceMeters, new Date(input.startAt), new Date(input.endAt), input.roundTrip, input.plannedWaitingMinutes) }));
  candidates.sort((a, b) => a.breakdown.totalPaise - b.breakdown.totalPaise || a.rate.vehicleId.localeCompare(b.rate.vehicleId));
  const selected = candidates[0];
  const routeObservation = { provider: 'HEIGIT_ORS' as const, profile: 'driving-car' as const, distanceMeters: route.distanceMeters, observedAt: route.observedAt, attribution: ROUTE_ATTRIBUTION };
  if (!selected) return BookingEstimateSchema.parse({ ...unavailable('Road distance available; no eligible vehicle rate is configured — owner will confirm the fare.'), distanceSource: 'ROUTING_PROVIDER', distanceKm: route.distanceMeters / 1000, routeObservation });
  return BookingEstimateSchema.parse({ status: 'ESTIMATED', message: 'Indicative road route estimate — owner will confirm the final fare.', distanceSource: 'ROUTING_PROVIDER', distanceKm: route.distanceMeters / 1000, estimatePaise: selected.breakdown.totalPaise, vehicleId: selected.rate.vehicleId, vehicleName: names.get(selected.rate.vehicleId), rateVersion: business.bookingRatesVersion ?? 0, rateSnapshot: selected.rate, breakdown: selected.breakdown, routeObservation, calculatedAt: new Date().toISOString() });
}
