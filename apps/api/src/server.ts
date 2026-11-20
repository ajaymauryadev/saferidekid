import './load-env.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import express from 'express';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import {attachTrackingSocket} from './tracking-socket.js';

const Config = z.object({ MONGODB_URI: z.string().url(), WEB_ORIGIN: z.string().url(), PORT: z.coerce.number().int().min(1).max(65535).default(4000), NODE_ENV: z.enum(['development', 'test', 'production']).default('development'), API_ALLOWED_HOSTS: z.string().optional(), SERVE_WEB_DIST: z.enum(['true','false']).default('false') });
const parsed = Config.safeParse(process.env);
if (!parsed.success) { console.error('API configuration missing or invalid: MONGODB_URI, WEB_ORIGIN and PORT are required.'); process.exit(1); }
const config = parsed.data;
const web = new URL(config.WEB_ORIGIN);
if (config.NODE_ENV === 'production' && web.protocol !== 'https:') { console.error('Production WEB_ORIGIN must use HTTPS.'); process.exit(1); }
const allowedHosts = config.NODE_ENV === 'production' ? [...new Set([
  web.host.toLowerCase(),
  process.env.RENDER_EXTERNAL_HOSTNAME?.toLowerCase(),
  ...(config.API_ALLOWED_HOSTS ?? '').split(',').map(value=>value.trim().toLowerCase())
].filter((host): host is string=>!!host))] : undefined;
mongoose.set('autoIndex',config.NODE_ENV !== 'production');
const app = createApp(config.WEB_ORIGIN,config.NODE_ENV === 'production',allowedHosts);
if (config.SERVE_WEB_DIST === 'true') {
  const webDist=resolve(process.cwd(),'apps/web/dist');
  if (!existsSync(resolve(webDist,'index.html'))) { console.error('Built frontend missing. Run npm run build before starting single-origin service.'); process.exit(1); }
  app.use('/assets',express.static(resolve(webDist,'assets'),{maxAge:'1y',immutable:true}));
  app.use(express.static(webDist,{index:false,fallthrough:true}));
  app.get('/{*path}',(req,res,next)=>{
    if (!req.accepts('html') || req.path.includes('.')) return next();
    res.setHeader('Cache-Control','no-cache');
    return res.sendFile(resolve(webDist,'index.html'));
  });
}
const server = app.listen(config.PORT, () => console.info(`SafeRide API listening on ${config.PORT}`));
const stopTrackingSocket=attachTrackingSocket(server,config.WEB_ORIGIN);
let stopping = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
async function connectDatabase() {
  try {
    await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10, minPoolSize: 0, maxIdleTimeMS: 30000 });
    if (!stopping) console.info('MongoDB connected');
  } catch {
    console.error('MongoDB unavailable; /api/ready returns 503. Retrying connection.');
    if (!stopping) retryTimer = setTimeout(() => { void connectDatabase(); }, 5000);
  }
}
void connectDatabase();
async function shutdown() { stopping = true; if (retryTimer) clearTimeout(retryTimer); await stopTrackingSocket(); server.close(); await mongoose.disconnect(); }
process.on('SIGINT', () => { void shutdown().finally(() => process.exit(0)); });
process.on('SIGTERM', () => { void shutdown().finally(() => process.exit(0)); });
