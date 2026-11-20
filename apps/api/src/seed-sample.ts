import './load-env.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { hashPassword } from './auth.js';
import { User } from './auth-models.js';
import { Business, DriverProfile, Vehicle } from './models.js';

const config = z.object({
  MONGODB_URI: z.string().url(),
  NODE_ENV: z.enum(['development', 'test']).default('development'),
  SEED_SAMPLE_PASSWORD: z.string().min(12),
}).safeParse(process.env);
if (!config.success || !/^mongodb:\/\/(?:localhost|127\.0\.0\.1):\d+\/[a-zA-Z0-9_]*(?:_dev|_test)(?:\?|$)/.test(config.data.MONGODB_URI)) {
  console.error('Sample seed requires a loopback MongoDB *_dev or *_test database, NODE_ENV != production and SEED_SAMPLE_PASSWORD (12+ characters).');
  process.exit(1);
}

try {
  await mongoose.connect(config.data.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  const db = mongoose.connection.db;
  if (!db || !/_(dev|test)$/.test(db.databaseName)) throw new Error('Sample seed database name must end in _dev or _test.');
  if (await Business.countDocuments() || await User.countDocuments() || await Vehicle.countDocuments()) throw new Error('Sample seed requires an empty local database. Run the guarded reset first if this data can be discarded.');
  await User.init();
  const business = await Business.create({ key: 'primary', name: 'SafeRide Development', serviceArea: 'Fictitious test area' });
  const passwordHash = await hashPassword(config.data.SEED_SAMPLE_PASSWORD);
  const [owner, customer, driver] = await User.create([
    { businessId: business._id, role: 'OWNER', name: 'Demo Owner (Fictitious)', mobile: '+12025550101', passwordHash, status: 'ACTIVE' },
    { businessId: business._id, role: 'CUSTOMER', name: 'Demo Customer (Fictitious)', mobile: '+12025550102', passwordHash, status: 'ACTIVE' },
    { businessId: business._id, role: 'DRIVER', name: 'Demo Driver (Fictitious)', mobile: '+12025550103', passwordHash, status: 'ACTIVE' },
  ]);
  await DriverProfile.create({ businessId: business._id, userId: driver._id, qualifications: ['PASSENGER', 'SCHOOL', 'GOODS'], licenseExpiry: '2099-12-31' });
  await Vehicle.create([
    { businessId: business._id, name: 'Demo Passenger Van', type: 'PASSENGER_VAN', seats:7, services:['school','wedding','party','local','urgent'], publicVisible:true, legalSuitabilityConfirmed:true, documentExpiry:'2099-12-31', registration:'DEMO-VAN-001' },
    { businessId: business._id, name: 'Demo Goods Pickup', type: 'GOODS_PICKUP', cargoPayloadKg:500, services:['goods'], publicVisible:true, legalSuitabilityConfirmed:true, documentExpiry:'2099-12-31', registration:'DEMO-GOODS-001' },
  ]);
  console.info(`Created fictitious local development data in ${db.databaseName}: owner ${owner.mobile}, customer ${customer.mobile}, driver ${driver.mobile}, 2 demo vehicles. Use SEED_SAMPLE_PASSWORD to sign in.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Sample seed failed.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
