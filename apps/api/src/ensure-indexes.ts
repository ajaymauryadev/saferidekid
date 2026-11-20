import './load-env.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { createApp } from './app.js';

const parsed=z.object({MONGODB_URI:z.string().url()}).safeParse(process.env);
if(!parsed.success){console.error('Set MONGODB_URI before creating indexes.');process.exit(1);}
void createApp('http://localhost'); // Imports routers and registers all models without listening.
await mongoose.connect(parsed.data.MONGODB_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000 });
try {
  for(const name of mongoose.modelNames()) {
    await mongoose.model(name).createIndexes();
    console.info(`Indexes ensured: ${name}`);
  }
} finally { await mongoose.disconnect(); }
