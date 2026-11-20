import './load-env.js';
import mongoose from 'mongoose';
import { z } from 'zod';

const parsed = z.object({
  MONGODB_URI: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}).safeParse(process.env);
if (!parsed.success || parsed.data.NODE_ENV === 'production') {
  console.error('Database reset requires valid configuration and NODE_ENV=development or test.');
  process.exit(1);
}

const confirmation = process.argv.find(arg => arg.startsWith('--confirm='))?.slice('--confirm='.length);
if (!confirmation || !/^DELETE-[a-zA-Z0-9_-]+$/.test(confirmation)) {
  console.error('Pass --confirm=DELETE-<database-name> to clear the named database.');
  process.exit(1);
}

try {
  await mongoose.connect(parsed.data.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection unavailable.');
  if (confirmation !== `DELETE-${db.databaseName}`) throw new Error('Confirmation does not match the connected database name. Nothing was deleted.');
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const before = Object.fromEntries(await Promise.all(collections.map(async ({ name }) => [name, await db.collection(name).countDocuments()])));
  console.info(JSON.stringify({ database: db.databaseName, before }));
  await db.dropDatabase();
  const remaining = await db.listCollections({}, { nameOnly: true }).toArray();
  if (remaining.length) throw new Error('Database drop returned but collections remain.');
  console.info(JSON.stringify({ database: db.databaseName, cleared: true, remainingCollections: 0 }));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Database reset failed.');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
