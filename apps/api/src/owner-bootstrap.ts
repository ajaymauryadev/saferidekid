import mongoose from 'mongoose';
import { User } from './auth-models.js';
import { hashPassword } from './auth.js';
import { Business } from './models.js';

export async function bootstrapOwner(input: { name: string; mobile: string; password: string }) {
  await User.init();
  const business = await Business.findOne({ key: 'primary' });
  if (!business) throw new Error('Configure the business with npm run seed:dev first.');
  if (await User.exists({ businessId: business._id, role: 'OWNER' })) throw new Error('Owner already exists. Bootstrap is one-time only.');
  try { return await User.create({ businessId: business._id, role: 'OWNER', name: input.name, mobile: input.mobile, passwordHash: await hashPassword(input.password), status: 'ACTIVE', contactVerified: false }); }
  catch (error) { if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) throw new Error('Owner already exists. Bootstrap is one-time only.'); throw error; }
}
