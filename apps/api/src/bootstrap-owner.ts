import './load-env.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { MobileSchema, PasswordSchema } from '@saferide/shared';
import { bootstrapOwner } from './owner-bootstrap.js';

const parsed = z.object({ MONGODB_URI: z.string().url(), BOOTSTRAP_OWNER_NAME: z.string().trim().min(2).max(100), BOOTSTRAP_OWNER_MOBILE: MobileSchema, BOOTSTRAP_OWNER_PASSWORD: PasswordSchema }).safeParse(process.env);
if (!parsed.success) { console.error('Set MONGODB_URI and valid BOOTSTRAP_OWNER_NAME, BOOTSTRAP_OWNER_MOBILE, BOOTSTRAP_OWNER_PASSWORD in the process environment.'); process.exit(1); }
await mongoose.connect(parsed.data.MONGODB_URI);
try {
  const owner = await bootstrapOwner({ name: parsed.data.BOOTSTRAP_OWNER_NAME, mobile: parsed.data.BOOTSTRAP_OWNER_MOBILE, password: parsed.data.BOOTSTRAP_OWNER_PASSWORD });
  console.info(`Owner created: ${owner._id}. Remove bootstrap secrets from the environment now.`);
} finally { await mongoose.disconnect(); }
