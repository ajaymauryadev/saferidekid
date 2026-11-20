import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../apps/api/dist/app.js';

const mongo = await MongoMemoryServer.create();
try {
  const app = createApp('http://localhost:5173');
  const before = await request(app).get('/api/ready');
  if (before.status !== 503) throw new Error(`Expected disconnected 503, got ${before.status}`);
  await mongoose.connect(mongo.getUri());
  const connected = await request(app).get('/api/ready');
  if (connected.status !== 200 || !connected.body.ready || connected.body.database !== 'connected') throw new Error(`Expected connected 200, got ${connected.status} ${JSON.stringify(connected.body)}`);
  await mongoose.disconnect();
  const after = await request(app).get('/api/ready');
  if (after.status !== 503) throw new Error(`Expected disconnected 503, got ${after.status}`);
  console.log('Readiness transitions: 503 disconnected → 200 connected → 503 disconnected');
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
