import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri('saferide_test');
const env = { ...process.env, MONGODB_URI: uri, NODE_ENV: 'test', SEED_SAMPLE_PASSWORD: 'FictitiousTestOnly1!' };
const tsx = resolve('node_modules/tsx/dist/cli.mjs');
function run(script, args = []) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [tsx, `apps/api/src/${script}`, ...args], { env });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolveRun() : reject(new Error(`${script} failed: ${output}`)));
  });
}
try {
  await run('seed-sample.ts');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Test database unavailable.');
  const counts = Object.fromEntries(await Promise.all(['businesses', 'users', 'vehicles', 'driverprofiles'].map(async name => [name, await db.collection(name).countDocuments()])));
  if (counts.businesses !== 1 || counts.users !== 3 || counts.vehicles !== 2 || counts.driverprofiles !== 1) throw new Error(`Unexpected seed counts: ${JSON.stringify(counts)}`);
  await mongoose.disconnect();
  await run('reset-database.ts', ['--confirm=DELETE-saferide_test']);
  await mongoose.connect(uri);
  const remaining = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  if (remaining.length) throw new Error(`Reset left ${remaining.length} collections.`);
  console.log('Isolated sample seed and complete reset passed.');
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}
