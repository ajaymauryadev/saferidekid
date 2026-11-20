import { Router } from 'express';
import mongoose from 'mongoose';
import { EnquiryInputSchema, publicServices, type PublicBusiness, type PublicVehicle } from '@saferide/shared';
import { Business, Enquiry, Vehicle } from './models.js';
import { User } from './auth-models.js';
import { deliver } from './notifications.js';
import { sendEnquiryEmail } from './enquiry-email.js';

export const publicRouter = Router();
const windows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60_000;
const reverseCache = new Map<string, { address: string; expiresAt: number }>();
let lastReverseRequestAt = 0;

function dbReady() { return mongoose.connection.readyState === 1; }
function unavailable(res: { status: (code: number) => { json: (body: unknown) => unknown } }) {
  return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'This service is temporarily unavailable. Please try again later.' } });
}
function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (/^\/assets\/[a-z0-9/_-]+\.(webp|png|jpe?g)$/i.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
function safePhone(value: unknown): string | null { return typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value) ? value : null; }
function allowedServices(type: string, services: string[]): string[] {
  const allowed = type === 'GOODS_PICKUP' ? ['goods'] : ['school', 'wedding', 'party', 'local', 'outstation', 'airport', 'urgent'];
  return services.filter(id => allowed.includes(id));
}
publicRouter.get('/services', (_req, res) => res.json(publicServices));
publicRouter.post('/reverse-location', async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const latitude = req.body?.latitude, longitude = req.body?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: { code: 'INVALID_LOCATION', message: 'Choose a valid point on the map.' } });
  }
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = reverseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return res.json({ address: cached.address });
  // A configured, contractually suitable provider is required for public traffic.
  if (!process.env.REVERSE_GEOCODER_URL) return res.status(503).json({ error: { code: 'LOOKUP_NOT_CONFIGURED', message: 'Address lookup is not configured. Enter a village or landmark.' } });
  if (Date.now() - lastReverseRequestAt < 1100) return res.status(429).json({ error: { code: 'LOOKUP_BUSY', message: 'Address lookup is busy. Enter a landmark or try the pin again.' } });
  lastReverseRequestAt = Date.now();
  try {
    const url = new URL(process.env.REVERSE_GEOCODER_URL);
    if (url.protocol !== 'https:') throw new Error('Reverse geocoder must use HTTPS.');
    url.search = new URLSearchParams({ lat: latitude.toFixed(5), lon: longitude.toFixed(5), format: 'jsonv2', addressdetails: '1', zoom: '18' }).toString();
    const response = await fetch(url, { headers: { 'User-Agent': 'SafeRide/0.1 (pickup address lookup)', Accept: 'application/json', ...(process.env.REVERSE_GEOCODER_API_KEY ? { Authorization: `Bearer ${process.env.REVERSE_GEOCODER_API_KEY}` } : {}) }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return res.status(503).json({ error: { code: 'LOOKUP_UNAVAILABLE', message: 'Address lookup is unavailable. Enter a landmark.' } });
    const result: unknown = await response.json();
    const address = typeof result === 'object' && result !== null && 'display_name' in result && typeof result.display_name === 'string' ? result.display_name.trim().slice(0, 250) : '';
    if (!address) return res.status(404).json({ error: { code: 'ADDRESS_NOT_FOUND', message: 'No mapped address was found. Enter a landmark.' } });
    if (reverseCache.size >= 1000) reverseCache.delete(reverseCache.keys().next().value!);
    reverseCache.set(key, { address, expiresAt: Date.now() + 24 * 60 * 60_000 });
    return res.json({ address });
  } catch {
    return res.status(503).json({ error: { code: 'LOOKUP_UNAVAILABLE', message: 'Address lookup is unavailable. Enter a landmark.' } });
  }
});
publicRouter.get('/business', async (_req, res, next) => {
  if (!dbReady()) return unavailable(res);
  try {
    const business = await Business.findOne({ key: 'primary' }).select('name contactName tagline phone email whatsapp serviceArea businessHours logoUrl serviceAreas homepageHeadline homepageDescription').lean();
    if (!business) return res.status(404).json({ error: { code: 'NOT_CONFIGURED', message: 'Business details have not been configured.' } });
    const safe: PublicBusiness = { name: business.name, contactName: business.contactName || null, tagline: business.tagline || null, phone: safePhone(business.phone), email: business.email || null, whatsapp: safePhone(business.whatsapp), serviceArea: business.serviceArea || null, businessHours: business.businessHours || null,logoUrl:safeImageUrl(business.logoUrl),serviceAreas:business.serviceAreas||[],homepageHeadline:business.homepageHeadline||'',homepageDescription:business.homepageDescription||'' };
    return res.json(safe);
  } catch (error) { return next(error); }
});
publicRouter.get('/vehicles', async (_req, res, next) => {
  if (!dbReady()) return unavailable(res);
  try {
    const business = await Business.findOne({ key: 'primary' }).select('_id').lean();
    if (!business) return res.json([]);
    const vehicles = await Vehicle.find({ businessId: business._id, publicVisible: true, active: true }).select('name type seats imageUrl services legalSuitabilityConfirmed documentExpiry').limit(30).lean();
    const today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
    const safe: PublicVehicle[] = vehicles.filter(v => v.type !== 'GOODS_PICKUP' || (v.legalSuitabilityConfirmed && (!v.documentExpiry || v.documentExpiry >= today))).map(v => ({ id: String(v._id), name: v.name, type: v.type as PublicVehicle['type'], seats: v.type === 'GOODS_PICKUP' ? null : v.seats ?? null, imageUrl: safeImageUrl(v.imageUrl), services: allowedServices(v.type, v.services) }));
    const rank: Record<PublicVehicle['type'], number> = { PASSENGER_VAN: 0, CAR: 1, GOODS_PICKUP: 2 };
    safe.sort((a,b) => rank[a.type] - rank[b.type] || a.name.localeCompare(b.name));
    return res.json(safe);
  } catch (error) { return next(error); }
});
publicRouter.post('/enquiries', async (req, res, next) => {
  if (!dbReady()) return unavailable(res);
  const now = Date.now();
  const ip = req.ip || 'unknown';
  const bucket = windows.get(ip);
  if (bucket && bucket.resetAt > now && bucket.count >= 10) {
    res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many enquiries. Please try again later.' } });
  }
  windows.set(ip, bucket && bucket.resetAt > now ? { ...bucket, count: bucket.count + 1 } : { count: 1, resetAt: now + WINDOW_MS });
  const parsed = EnquiryInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the enquiry fields.', fields: parsed.error.flatten().fieldErrors } });
  try {
    const business = await Business.findOne({ key: 'primary' }).select('_id').lean();
    if (!business) return res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'Enquiries are not configured yet.' } });
    const phone = parsed.data.phone.replace(/[\s-]/g, '');
    const recent = await Enquiry.countDocuments({ businessId: business._id, phone, createdAt: { $gte: new Date(now - WINDOW_MS) } });
    if (recent >= 3) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many enquiries from this number. Please try again later.' } });
    const enquiry = await Enquiry.create({ businessId: business._id, name: parsed.data.name, phone, service: parsed.data.service, message: parsed.data.message });
    const owners=await User.find({businessId:business._id,role:'OWNER',status:'ACTIVE'}).select('_id').lean();
    await deliver(business._id,owners.map(o=>o._id),'CONTACT_ENQUIRY','New contact enquiry','Open Notices & Enquiries to review the message.',`enquiry:${enquiry._id}`);
    try {
      await sendEnquiryEmail({ id: String(enquiry._id), name: enquiry.name, phone: enquiry.phone, service: enquiry.service, message: enquiry.message });
    } catch {
      console.error('Enquiry email delivery failed; the enquiry remains saved for owner review.');
    }
    return res.status(201).json({ id: String(enquiry._id), status: 'RECEIVED', message: 'Your enquiry has been received. The operator will review it when available.' });
  } catch (error) { return next(error); }
});

