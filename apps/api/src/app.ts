import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import cookieParser from 'cookie-parser';
import { publicRouter } from './public.js';
import { createAuthRouter, isAllowedWebOrigin } from './auth.js';
import { createOwnerAuthRouter } from './owner-auth.js';
import { createOwnerControlRouter } from './owner-control.js';
import { createCustomerRouter } from './customer.js';
import { createCustomerSchoolRouter, createOwnerSchoolRouter } from './school.js';
import { createCustomerStudentsRouter, createOwnerStudentsRouter } from './students.js';
import { createDriverScheduleRouter, createOwnerFleetRouter } from './fleet.js';
import { createRunRouter } from './runs.js';
import { createLeaveRouter } from './leaves.js';
import { createTrackingRouter } from './tracking.js';
import {createBookingRouter,createOwnerBookingRouter} from './bookings.js';
import {createPublicUrgentRouter,createOwnerUrgentRouter} from './urgent.js';
import {createCustomerPaymentRouter,createOwnerPaymentRouter} from './payments.js';
import {createFeeRouter,createFeeJobRouter} from './fees.js';
import {createDriverRouter} from './driver.js';
import {createStudentAccessRouter} from './student-access.js';
import {createStudentHomeRouter} from './student-home.js';
import { createNotificationRouter, createOwnerCommunicationRouter } from './notifications.js';
import { createOwnerOverviewRouter } from './owner-overview.js';
import {createFinanceRouter,createCustomerFinanceRouter} from './finance.js';

const databaseState = () => ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] as 'connected' | 'disconnected' | 'connecting' | 'disconnecting';
export function createApp(webOrigin: string, secureCookies = process.env.NODE_ENV === 'production', allowedHosts?: readonly string[]) {
  const app = express();
  app.disable('x-powered-by');
  if (allowedHosts?.length) app.use((req, res, next) => {
    const host = req.get('host')?.toLowerCase();
    if (!host || !allowedHosts.includes(host)) return res.status(421).json({ error: { code: 'HOST_DENIED', message: 'Host is not configured for this service.' } });
    return next();
  });
  app.use(helmet({
    contentSecurityPolicy:{directives:{imgSrc:["'self'","data:","https://tile.openstreetmap.org"]}},
    referrerPolicy:{policy:'strict-origin-when-cross-origin'}
  }));
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || isAllowedWebOrigin(origin, webOrigin)), credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  app.use(pinoHttp({ redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie', 'req.body.password', 'req.body.phone', 'req.body.email'], censor: '[Redacted]' }, serializers: { req: (req) => ({ method: req.method, url: req.url }), res: (res) => ({ statusCode: res.statusCode }) } }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'saferide-api' }));
  app.get('/api/ready', (_req, res) => { const database = databaseState(); res.status(database === 'connected' ? 200 : 503).json({ ready: database === 'connected', database }); });
  app.use('/api/public', publicRouter);
  app.use('/api/public/urgent',createPublicUrgentRouter(webOrigin));
  app.use('/api/auth', createAuthRouter(webOrigin, secureCookies));
  app.use('/api/owner', createOwnerAuthRouter(webOrigin));
  app.use('/api/owner/control', createOwnerControlRouter(webOrigin));
  app.use('/api/owner/school', createOwnerSchoolRouter(webOrigin));
  app.use('/api/owner/ops', createOwnerFleetRouter(webOrigin));
  app.use('/api/owner/students', createOwnerStudentsRouter(webOrigin));
  app.use('/api/student-access',createStudentAccessRouter(webOrigin));
  app.use('/api/student',createStudentHomeRouter(webOrigin));
  app.use('/api/customer', createCustomerRouter(webOrigin));
  app.use('/api/customer/school', createCustomerSchoolRouter(webOrigin));
  app.use('/api/customer/students', createCustomerStudentsRouter(webOrigin));
  app.use('/api/driver/schedule', createDriverScheduleRouter(webOrigin));
  app.use('/api/driver',createDriverRouter(webOrigin));
  app.use('/api/runs', createRunRouter(webOrigin));
  app.use('/api/leaves', createLeaveRouter(webOrigin));
  app.use('/api/tracking', createTrackingRouter(webOrigin));
  app.use('/api/customer/bookings',createBookingRouter(webOrigin));
  app.use('/api/owner/bookings',createOwnerBookingRouter(webOrigin));
  app.use('/api/owner/urgent',createOwnerUrgentRouter(webOrigin));
  app.use('/api/notifications',createNotificationRouter(webOrigin));
  app.use('/api/owner/communications',createOwnerCommunicationRouter(webOrigin));
  app.use('/api/owner/overview',createOwnerOverviewRouter(webOrigin));
  app.use('/api/owner/finance',createFinanceRouter(webOrigin));
  app.use('/api/customer/finance',createCustomerFinanceRouter(webOrigin));
  app.use('/api/customer/payments',createCustomerPaymentRouter(webOrigin));
  app.use('/api/owner/payments',createOwnerPaymentRouter(webOrigin));
  app.use('/api/fees',createFeeRouter(webOrigin));
  app.use('/api/jobs/fees',createFeeJobRouter());
  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'This API route is not available.' } }));
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next;
    const status = error instanceof SyntaxError && 'body' in error ? 400 : error?.type === 'entity.too.large' ? 413 : 500;
    res.status(status).json({ error: { code: status === 400 ? 'BAD_JSON' : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR', message: status === 500 ? 'Something went wrong.' : status === 413 ? 'Request body is too large.' : 'Invalid JSON.' } });
  };
  app.use(errorHandler);
  return app;
}
