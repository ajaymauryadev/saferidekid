import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mongoose from 'mongoose';

const run=promisify(execFile),mongo=await MongoMemoryReplSet.create({replSet:{count:1}});
try {
  const {stdout}=await run(process.execPath,['apps/api/dist/ensure-indexes.js'],{env:{...process.env,MONGODB_URI:mongo.getUri()},timeout:60000});
  await mongoose.connect(mongo.getUri());
  const collections=await mongoose.connection.db.listCollections().toArray();
  const names=collections.map(x=>x.name);
  if(!names.includes('sessions')||!names.includes('triplocations'))throw Error('Expected indexed collections missing');
  const sessions=await mongoose.connection.db.collection('sessions').listIndexes().toArray();
  const locations=await mongoose.connection.db.collection('triplocations').listIndexes().toArray();
  if(!sessions.some(x=>x.expireAfterSeconds===0)||!locations.some(x=>x.expireAfterSeconds===0))throw Error('Expected TTL indexes missing');
  console.log(`Index migration passed: ${stdout.trim().split('\n').length} models; session and GPS TTL indexes present.`);
} finally { await mongoose.disconnect(); await mongo.stop(); }
