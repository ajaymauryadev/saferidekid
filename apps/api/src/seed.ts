import './load-env.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Business } from './models.js';

const Phone = z.string().regex(/^\+[1-9]\d{7,14}$/);
const config = z.object({ MONGODB_URI: z.string().url(), BUSINESS_NAME: z.string().trim().min(2).max(100).default('SafeRide'), PUBLIC_CONTACT_NAME: z.string().trim().max(100).optional(), PUBLIC_PHONE: z.union([Phone, z.literal('')]).optional(), PUBLIC_EMAIL: z.union([z.email(), z.literal('')]).optional(), PUBLIC_WHATSAPP: z.union([Phone, z.literal('')]).optional(), PUBLIC_AREA: z.string().trim().max(200).optional(), PUBLIC_HOURS: z.string().trim().max(120).optional() }).safeParse(process.env);
if (!config.success) { console.error('Set MONGODB_URI and valid optional business fields in .env before seeding.'); process.exit(1); }
await mongoose.connect(config.data.MONGODB_URI);
const { BUSINESS_NAME, PUBLIC_CONTACT_NAME, PUBLIC_PHONE, PUBLIC_EMAIL, PUBLIC_WHATSAPP, PUBLIC_AREA, PUBLIC_HOURS } = config.data;
await Business.updateOne({ key: 'primary' }, { $set: { name: BUSINESS_NAME, contactName: PUBLIC_CONTACT_NAME || null, phone: PUBLIC_PHONE || null, email: PUBLIC_EMAIL || null, whatsapp: PUBLIC_WHATSAPP || null, serviceArea: PUBLIC_AREA || null, businessHours: PUBLIC_HOURS || null }, $setOnInsert: { key: 'primary' } }, { upsert: true });
console.info('Public business settings saved. No demo identities, payments or vehicles were created.');
await mongoose.disconnect();
